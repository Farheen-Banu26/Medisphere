package com.infosys.explainability_service.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI explainabilityOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Explainability Service API")
                        .description("Deterministic explainability endpoints for MediSphere")
                        .version("1.0"));
    }
}
