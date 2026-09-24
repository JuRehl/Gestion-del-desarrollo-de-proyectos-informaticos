package com.gestion.tpbackend.repository;

import com.gestion.tpbackend.entity.Gasto;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GastoRepository extends JpaRepository<Gasto, Long> {

    List<Gasto> findAllByOrderByFechaDesc();

    List<Gasto> findByEdificioIdOrderByFechaDesc(Long edificioId);

    List<Gasto> findByFechaBetweenOrderByFechaDesc(LocalDateTime inicio, LocalDateTime fin);

    List<Gasto> findByEdificioIdAndFechaBetweenOrderByFechaDesc(Long edificioId, LocalDateTime inicio, LocalDateTime fin);
}