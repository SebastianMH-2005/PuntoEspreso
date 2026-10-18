package com.puntoespresso.puntoespresso.admin;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UsuarioSistemaRequest(
                @NotBlank(message = "El nombre es obligatorio") @Size(min = 2, max = 100, message = "El nombre debe tener entre 2 y 100 caracteres") String nombre,
                @NotBlank(message = "El email es obligatorio") @Email(message = "El email no es válido") @Size(max = 100, message = "El email es demasiado largo") String email,
                @NotBlank(message = "La contraseña es obligatoria") @Size(min = 8, max = 72, message = "La contraseña debe tener entre 8 y 72 caracteres") String contrasena) {
}