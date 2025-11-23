package com.myapp.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("MyApp Backend API")
                        .description("Demo Backend Application API Documentation")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("MyApp Team")
                                .email("support@myapp.com")))
                .servers(List.of(
                        new Server()
                                .url("http://myapp-alb-1748281401.ap-northeast-2.elb.amazonaws.com")
                                .description("AWS ALB Server"),
                        new Server()
                                .url("http://localhost:8080")
                                .description("Local Development Server"),
                        new Server()
                                .url("https://api.myapp.com")
                                .description("Production Server")
                ));
    }
}
