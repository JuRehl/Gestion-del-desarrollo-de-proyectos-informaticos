package com.gestion.tpbackend.controller;

import com.gestion.tpbackend.scheduler.RecordatorioPagoScheduler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test")
public class TestController {

    private final RecordatorioPagoScheduler scheduler;

    public TestController(RecordatorioPagoScheduler scheduler) {
        this.scheduler = scheduler;
    }

    @PostMapping("/recordatorio")
    public String dispararRecordatorio() {
        scheduler.verificarVencimientos();
        return "Scheduler ejecutado";
    }
}