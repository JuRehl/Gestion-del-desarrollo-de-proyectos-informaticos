package com.gestion.tpbackend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.gestion.tpbackend.entity.Edificio;
import com.gestion.tpbackend.entity.RolUsuario;
import com.gestion.tpbackend.entity.Usuario;
import com.gestion.tpbackend.repository.EdificioRepository;
import com.gestion.tpbackend.repository.UnidadRepository;
import com.gestion.tpbackend.repository.UsuarioRepository;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class EdificioServiceTest {

    @Mock
    private EdificioRepository edificioRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private UnidadRepository unidadRepository;

    @Mock
    private UsuarioService usuarioService;

    private EdificioService edificioService;

    @BeforeEach
    void setUp() {
        edificioService = new EdificioService(edificioRepository, usuarioRepository, unidadRepository, usuarioService);
    }

    @Test
    void obtenerPorPropietario_debeRetornarEdificiosDelUsuario() {
        Usuario propietario = new Usuario("Admin", "admin@example.com", RolUsuario.ADMIN, "secret");
        ReflectionTestUtils.setField(propietario, "id", 1L);

        Edificio edificio1 = new Edificio("Edificio 1", "Direccion 1", 10, 10, 1000.0, propietario);
        Edificio edificio2 = new Edificio("Edificio 2", "Direccion 2", 5, 5, 500.0, propietario);

        when(edificioRepository.findByPropietarioEmail("admin@example.com")).thenReturn(List.of(edificio1, edificio2));

        List<Edificio> edificios = edificioService.obtenerPorPropietario("admin@example.com");

        assertThat(edificios).hasSize(2);
        assertThat(edificios).contains(edificio1, edificio2);
    }
}
