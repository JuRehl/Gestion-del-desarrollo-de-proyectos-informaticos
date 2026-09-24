package com.gestion.tpbackend.scheduler;

import com.gestion.tpbackend.entity.Deuda;
import com.gestion.tpbackend.entity.Unidad;
import com.gestion.tpbackend.repository.UnidadRepository;
import com.gestion.tpbackend.service.DeudaService;
import com.gestion.tpbackend.service.EmailService;
import java.time.YearMonth;
import java.util.List;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class RecordatorioPagoScheduler {

    private final UnidadRepository unidadRepository;
    private final DeudaService deudaService;
    private final EmailService emailService;

    public RecordatorioPagoScheduler(UnidadRepository unidadRepository,
                                      DeudaService deudaService,
                                      EmailService emailService) {
        this.unidadRepository = unidadRepository;
        this.deudaService = deudaService;
        this.emailService = emailService;
    }

    @Scheduled(cron = "0 0 19 * * *", zone = "America/Argentina/Buenos_Aires")
    public void verificarVencimientos() {
        int diaHoy = java.time.LocalDate.now().getDayOfMonth();
        int ultimoDiaMes = YearMonth.now().lengthOfMonth();

        int diasRestantes = ultimoDiaMes - diaHoy;

        if (diasRestantes != 7 && diasRestantes != 1 && diasRestantes != 0) {
            return;
        }

        List<Unidad> unidades = unidadRepository.findAll().stream()
            .filter(u -> u.getInquilino() != null)
            .toList();

        for (Unidad unidad : unidades) {
            Long inquilinoId = unidad.getInquilino().getId();
            Long edificioId = unidad.getEdificio().getId();

            double deudaPendiente = deudaService.obtenerTotalPendiente(inquilinoId, edificioId);

            if (deudaPendiente <= 0) {
                continue;
            }

            String emailInquilino = unidad.getInquilino().getEmail();
            String nombreInquilino = unidad.getInquilino().getNombre();

            if (diasRestantes == 0) {
                emailService.enviarRecordatorioUltimodia(emailInquilino, nombreInquilino, deudaPendiente, unidad);
            } else if (diasRestantes == 1) {
                emailService.enviarRecordatorio(emailInquilino, nombreInquilino, deudaPendiente, unidad, "un día");
            } else {
                emailService.enviarRecordatorio(emailInquilino, nombreInquilino, deudaPendiente, unidad, "un semana"); //Modificarlo para la demo
            }
        }
    }
}