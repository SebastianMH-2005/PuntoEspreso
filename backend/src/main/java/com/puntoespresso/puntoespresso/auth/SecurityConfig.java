package com.puntoespresso.puntoespresso.auth;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final CustomUserDetailsService userDetailsService;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter, CustomUserDetailsService userDetailsService) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.userDetailsService = userDetailsService;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Páginas públicas (Thymeleaf) y recursos estáticos
                        // /admin también queda aquí: la página carga para cualquiera, pero se
                        // vacía por JavaScript si no hay un token de ADMIN/OPERADOR en localStorage.
                        // La protección real está en /api/admin/**, más abajo.
                        .requestMatchers("/", "/index", "/catalogo", "/contacto", "/nosotros", "/login", "/registro",
                                "/checkout", "/mis-pedidos", "/carrito", "/admin", "/error", "/css/**", "/js/**",
                                "/img/**", "/robots.txt", "/sitemap.xml", "/favicon.ico")
                        .permitAll()
                        // API pública de lectura + autenticación
                        .requestMatchers("/api/auth/**", "/api/productos/**", "/api/sedes/**", "/api/categorias/**")
                        .permitAll()
                        // Documentación y monitoreo
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/actuator/**").permitAll()
                        // API del panel admin: aquí sí se exige el rol de verdad
                        // Órdenes: las atienden ADMIN y OPERADOR
                        .requestMatchers("/api/admin/ordenes/**").hasAnyRole("ADMIN", "OPERADOR")
                        // Productos, sedes y personal: solo ADMIN
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        // Pedidos propios: solo clientes
                        .requestMatchers("/api/pedidos/**").hasRole("CLIENTE")
                        // Todo lo demás requiere estar logueado
                        .anyRequest().authenticated())
                .exceptionHandling(ex -> ex.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}