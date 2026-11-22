package com.puntoespresso.puntoespresso.auth;

import com.puntoespresso.puntoespresso.exception.SolicitudInvalidaException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimNames;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;

import java.util.Collection;

/**
 * Comprueba que una credencial de "Continuar con Google" sea auténtica: firma con las claves públicas
 * de Google, vigencia, emisor y que haya sido emitida para ESTA aplicación (el ID de cliente).
 */
@Component
public class GoogleTokenVerifier {

    private static final String CLAVES_PUBLICAS_GOOGLE = "https://www.googleapis.com/oauth2/v3/certs";
    private static final String EMISOR_GOOGLE = "https://accounts.google.com";

    private final String clientId;
    private volatile JwtDecoder decoder; // se crea la primera vez que se usa

    public GoogleTokenVerifier(@Value("${app.google.client-id:}") String clientId) {
        this.clientId = clientId == null ? "" : clientId.trim();
    }

    public GoogleIdentidad verificar(String credencial) {
        if (clientId.isEmpty()) {
            throw new SolicitudInvalidaException("El inicio de sesión con Google no está habilitado");
        }
        try {
            Jwt jwt = decoder().decode(credencial);
            return new GoogleIdentidad(
                    jwt.getClaimAsString("email"),
                    Boolean.TRUE.equals(jwt.getClaimAsBoolean("email_verified")),
                    jwt.getClaimAsString("name"));
        } catch (JwtException e) {
            throw new BadCredentialsException("Credencial de Google inválida", e);
        }
    }

    private JwtDecoder decoder() {
        JwtDecoder actual = decoder;
        if (actual == null) {
            synchronized (this) {
                if (decoder == null) {
                    decoder = crearDecoder();
                }
                actual = decoder;
            }
        }
        return actual;
    }

    private JwtDecoder crearDecoder() {
        NimbusJwtDecoder nuevo = NimbusJwtDecoder.withJwkSetUri(CLAVES_PUBLICAS_GOOGLE).build();
        OAuth2TokenValidator<Jwt> audiencia = new JwtClaimValidator<Collection<String>>(
                JwtClaimNames.AUD, aud -> aud != null && aud.contains(clientId));
        nuevo.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefaultWithIssuer(EMISOR_GOOGLE), audiencia));
        return nuevo;
    }
}