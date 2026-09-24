error id: file://<WORKSPACE>/backend/src/main/java/com/gestion/tpbackend/service/ContratoService.java:_empty_/MetodoPago#TARJETA#
file://<WORKSPACE>/backend/src/main/java/com/gestion/tpbackend/service/ContratoService.java
empty definition using pc, found symbol in pc: _empty_/MetodoPago#TARJETA#
empty definition using semanticdb
empty definition using fallback
non-local guesses:

offset: 2258
uri: file://<WORKSPACE>/backend/src/main/java/com/gestion/tpbackend/service/ContratoService.java
text:
```scala
package com.gestion.tpbackend.service;

import com.gestion.tpbackend.entity.Contrato;
import com.gestion.tpbackend.entity.Contrato.EstadoPago;
import com.gestion.tpbackend.entity.Contrato.MetodoPago;
import com.gestion.tpbackend.entity.Unidad;
import com.gestion.tpbackend.entity.Usuario;
import com.gestion.tpbackend.repository.ContratoRepository;
import com.gestion.tpbackend.repository.UnidadRepository;
import com.gestion.tpbackend.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ContratoService {

    private final ContratoRepository contratoRepository;
    private final UsuarioRepository usuarioRepository;
    private final UnidadRepository unidadRepository;

    public ContratoService(ContratoRepository contratoRepository,
                           UsuarioRepository usuarioRepository,
                           UnidadRepository unidadRepository) {
        this.contratoRepository = contratoRepository;
        this.usuarioRepository = usuarioRepository;
        this.unidadRepository = unidadRepository;
    }

    /**
     * Registra un pago. El estado se determina por el método:
     * - TARJETA → PAGADO
     * - EFECTIVO → PENDIENTE
     */
    public Contrato registrarPago(String emailInquilino, Long edificioId, Double monto, MetodoPago metodo, String nota) {
        Usuario inquilino = usuarioRepository.findByEmail(emailInquilino)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inquilino no encontrado"));

        // Buscar la unidad del inquilino en el edificio indicado
        Unidad unidad = unidadRepository.findAll().stream()
                .filter(u -> u.getInquilino() != null
                        && u.getInquilino().getId().equals(inquilino.getId())
                        && u.getEdificio().getId().equals(edificioId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No se encontró una unidad asignada a este inquilino en el edificio indicado"));

        EstadoPago estado = (metodo == MetodoPago.TARJ@@ETA) ? EstadoPago.PAGADO : EstadoPago.PENDIENTE;

        Contrato contrato = new Contrato(unidad, inquilino, monto, metodo, estado, nota);
        return contratoRepository.save(contrato);
    }

    public List<Contrato> obtenerPorInquilino(String email) {
        Usuario inquilino = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inquilino no encontrado"));
        return contratoRepository.findByInquilinoId(inquilino.getId());
    }

    public List<Contrato> obtenerPorEdificio(Long edificioId) {
        return contratoRepository.findByUnidadEdificioId(edificioId);
    }

    public List<Contrato> obtenerTodos() {
        return contratoRepository.findAll();
    }

    public Contrato marcarComoPagado(Long contratoId) {
        Contrato contrato = contratoRepository.findById(contratoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contrato no encontrado"));
        contrato.setEstado(EstadoPago.PAGADO);
        return contratoRepository.save(contrato);
    }
}
```


#### Short summary: 

empty definition using pc, found symbol in pc: _empty_/MetodoPago#TARJETA#