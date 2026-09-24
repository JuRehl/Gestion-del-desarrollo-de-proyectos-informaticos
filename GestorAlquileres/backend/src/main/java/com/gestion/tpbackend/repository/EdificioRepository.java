package com.gestion.tpbackend.repository;

import java.util.List;
import com.gestion.tpbackend.entity.Edificio;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EdificioRepository extends JpaRepository<Edificio, Long> {
    List<Edificio> findByPropietarioEmail(String email);
}
