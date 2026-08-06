package com.infosys.model_management_service.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI modelManagementOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Model Management Service API")
                        .description("APIs for managing AI model metadata, versions, and deployment status.")
                        .version("1.0"));
    }
}
