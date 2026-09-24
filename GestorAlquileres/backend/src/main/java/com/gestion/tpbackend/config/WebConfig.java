package com.gestion.tpbackend.config;

import java.util.Arrays;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${APP_CORS_ORIGINS:http://localhost:5173,http://frontend}")
    private String corsOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String[] origins = Arrays.stream(corsOrigins.split(","))
            .map(String::trim)
            .filter(origin -> !origin.isBlank())
            .toArray(String[]::new);

        registry.addMapping("/api/**")
            .allowedOrigins(origins)
            .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
            .allowedHeaders("*");
    }
}
