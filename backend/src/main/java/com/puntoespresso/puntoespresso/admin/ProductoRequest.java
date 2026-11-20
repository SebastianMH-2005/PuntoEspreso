package com.puntoespresso.puntoespresso.admin;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.math.BigDecimal;
import jakarta.validation.constraints.Size;

public record ProductoRequest(
                @NotNull(message = "La categoría es obligatoria") Integer idCategoria,
                @NotBlank(message = "El nombre es obligatorio") @Size(max = 100, message = "El nombre no puede superar los 100 caracteres") String nombre,
                @NotNull(message = "El precio es obligatorio") @DecimalMin(value = "0.01", message = "El precio debe ser mayor a 0") @Digits(integer = 8, fraction = 2, message = "El precio admite como máximo 2 decimales") BigDecimal precio,
                @NotBlank(message = "La descripción es obligatoria") @Size(max = 255, message = "La descripción no puede superar los 255 caracteres") String descripcion,
                @Min(value = 0, message = "El stock no puede ser negativo") @Max(value = 100000, message = "El stock es demasiado alto") int stock,
                @NotBlank(message = "La imagen es obligatoria") @Pattern(regexp = "[\\w\\-]+\\.(jpg|jpeg|png|webp)", message = "La imagen debe ser un nombre de archivo como cafe-latte.jpg") String imagen) {
}