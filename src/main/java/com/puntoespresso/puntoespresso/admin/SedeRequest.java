package com.puntoespresso.puntoespresso.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SedeRequest(
        @NotBlank(message = "El nombre es obligatorio") @Size(max = 100, message = "Nombre demasiado largo") String nombre,
        @NotBlank(message = "La dirección es obligatoria") @Size(max = 200, message = "Dirección demasiado larga") String direccion,
        @NotBlank(message = "Los días de atención son obligatorios") @Size(max = 60, message = "Días demasiado largos") String horarioDias,
        @NotBlank(message = "El horario es obligatorio") @Size(max = 40, message = "Horario demasiado largo") String horarioHoras) {
            
        }