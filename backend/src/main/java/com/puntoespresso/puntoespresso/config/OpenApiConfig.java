package com.puntoespresso.puntoespresso.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI puntoEspressoOpenApi() {
        return new OpenAPI().info(new Info()
                .title("PuntoEspresso API")
                .description("Endpoints REST de la cafetería PuntoEspresso: catálogo de productos y sedes.")
                .version("v1"));
    }
}
