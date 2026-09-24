package com.gestion.tpbackend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.gestion.tpbackend.entity.Deuda;
import com.gestion.tpbackend.entity.Deuda.EstadoDeuda;
import com.gestion.tpbackend.entity.Deuda.TipoDeuda;
import com.gestion.tpbackend.entity.Edificio;
import com.gestion.tpbackend.entity.RolUsuario;
import com.gestion.tpbackend.entity.Unidad;
import com.gestion.tpbackend.entity.Usuario;
import com.gestion.tpbackend.repository.DeudaRepository;
import com.gestion.tpbackend.repository.EdificioRepository;
import com.gestion.tpbackend.repository.UnidadRepository;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class DeudaServiceTest {

    @Mock
    private DeudaRepository deudaRepository;

    @Mock
    private UnidadRepository unidadRepository;

    @Mock
    private EdificioRepository edificioRepository;

    private DeudaService deudaService;

    @BeforeEach
    void setUp() {
        deudaService = new DeudaService(deudaRepository, unidadRepository, edificioRepository);
    }

    @Test
    void asegurarDeudaBaseMensual_arrastraAlquilerPendienteAlMesSiguiente() {
        Usuario inquilino = new Usuario("Inquilino", "inq@example.com", RolUsuario.INQ, "secret");
        ReflectionTestUtils.setField(inquilino, "id", 1L);

        Edificio edificio = new Edificio("Edificio A", "Calle 1", 1, 1, 0.0, inquilino);
        ReflectionTestUtils.setField(edificio, "id", 2L);

        Unidad unidad = new Unidad("1A", 40.0, "1", edificio);
        ReflectionTestUtils.setField(unidad, "id", 3L);
        unidad.setInquilino(inquilino);
        unidad.setMontoAlquiler(100.0);
        unidad.setPorcentajeDepartamento(0.0);

        Deuda deudaAnterior = new Deuda(inquilino, unidad, edificio, TipoDeuda.ALQUILER, "2026-04", 100.0, "Alquiler mensual");
        ReflectionTestUtils.setField(deudaAnterior, "id", 10L);

        when(deudaRepository.findByUnidadIdAndTipoAndEstadoInAndPeriodoLessThanOrderByPeriodoAscCreadaEnAsc(
            eq(3L),
            eq(TipoDeuda.ALQUILER),
            any(),
            eq("2026-05")
        )).thenReturn(List.of(deudaAnterior));
        when(deudaRepository.findByUnidadIdAndPeriodoAndTipo(3L, "2026-05", TipoDeuda.ALQUILER))
            .thenReturn(Optional.empty());

        deudaService.asegurarDeudaBaseMensual(unidad, YearMonth.of(2026, 5));

        ArgumentCaptor<Deuda> captor = ArgumentCaptor.forClass(Deuda.class);
        verify(deudaRepository, times(2)).save(captor.capture());

        Deuda deudaArrastrada = captor.getAllValues().get(0);
        Deuda deudaNueva = captor.getAllValues().get(1);

        assertThat(deudaArrastrada.getEstado()).isEqualTo(EstadoDeuda.ARRASTRADA);
        assertThat(deudaArrastrada.getMontoPendiente()).isZero();

        assertThat(deudaNueva.getPeriodo()).isEqualTo("2026-05");
        assertThat(deudaNueva.getMontoOriginal()).isEqualTo(200.0);
        assertThat(deudaNueva.getMontoPendiente()).isEqualTo(200.0);
        assertThat(deudaNueva.getEstado()).isEqualTo(EstadoDeuda.PENDIENTE);
        assertThat(deudaNueva.getDescripcion()).contains("saldo arrastrado");
    }
}