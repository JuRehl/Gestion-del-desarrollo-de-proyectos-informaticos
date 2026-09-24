package com.gestion.tpbackend.repository;

import com.gestion.tpbackend.entity.Deuda;
import com.gestion.tpbackend.entity.Deuda.EstadoDeuda;
import com.gestion.tpbackend.entity.Deuda.TipoDeuda;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DeudaRepository extends JpaRepository<Deuda, Long> {

    Optional<Deuda> findByUnidadIdAndPeriodoAndTipo(Long unidadId, String periodo, TipoDeuda tipo);

    List<Deuda> findByUnidadIdAndTipoAndEstadoInAndPeriodoLessThanOrderByPeriodoAscCreadaEnAsc(
        Long unidadId,
        TipoDeuda tipo,
        List<EstadoDeuda> estados,
        String periodo
    );

    List<Deuda> findByInquilinoIdAndEdificioIdAndEstadoInOrderByPeriodoAscCreadaEnAsc(
        Long inquilinoId,
        Long edificioId,
        List<EstadoDeuda> estados
    );

    List<Deuda> findByInquilinoIdAndEstadoInOrderByPeriodoAscCreadaEnAsc(Long inquilinoId, List<EstadoDeuda> estados);

    boolean existsByEdificioIdAndTipoAndEstadoIn(Long edificioId, TipoDeuda tipo, List<EstadoDeuda> estados);

    @Query("""
        select coalesce(sum(d.montoPendiente), 0)
        from Deuda d
        where d.inquilino.id = :inquilinoId
          and d.edificio.id = :edificioId
          and d.estado in :estados
    """)
    Double totalPendientePorInquilinoYEdificio(
        @Param("inquilinoId") Long inquilinoId,
        @Param("edificioId") Long edificioId,
        @Param("estados") List<EstadoDeuda> estados
    );
}
