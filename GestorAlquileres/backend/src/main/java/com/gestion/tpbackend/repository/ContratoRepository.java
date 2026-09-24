package com.gestion.tpbackend.repository;
 
import com.gestion.tpbackend.entity.Contrato;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
 
import java.util.List;
 
@Repository
public interface ContratoRepository extends JpaRepository<Contrato, Long> {
    List<Contrato> findByInquilinoId(Long inquilinoId);
    List<Contrato> findByUnidadEdificioId(Long edificioId);
    List<Contrato> findByUnidadId(Long unidadId);
}