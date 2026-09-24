package com.gestion.tpbackend.repository;

import com.gestion.tpbackend.entity.Unidad;
import com.gestion.tpbackend.entity.Edificio;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UnidadRepository extends JpaRepository<Unidad, Long> {
    List<Unidad> findByEdificioId(Long edificioId);
    Optional<Unidad> findByEdificioIdAndPisoAndNombre(Long edificioId, String piso, String nombre);

    @Query("SELECT DISTINCT u.edificio FROM Unidad u WHERE u.inquilino.id = :userId")
    List<Edificio> findEdificiosByInquilinoId(@Param("userId") Long userId);
}