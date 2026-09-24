package com.gestion.tpbackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TpBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(TpBackendApplication.class, args);
    }
}
