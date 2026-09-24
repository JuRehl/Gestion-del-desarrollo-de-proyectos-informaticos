package com.gestion.tpbackend.repository;

import com.gestion.tpbackend.entity.HistorialContrato;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistorialContratoRepository extends JpaRepository<HistorialContrato, Long> {
    List<HistorialContrato> findByInquilinoId(Long inquilinoId);
    List<HistorialContrato> findByUnidadId(Long unidadId);
    List<HistorialContrato> findByInquilinoIdAndFechaFinIsNull(Long inquilinoId);
}