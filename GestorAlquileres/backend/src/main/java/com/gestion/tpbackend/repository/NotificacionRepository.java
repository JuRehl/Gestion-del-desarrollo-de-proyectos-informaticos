package com.gestion.tpbackend.repository;

import com.gestion.tpbackend.entity.Notificacion;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {
}
