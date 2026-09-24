package com.gestion.tpbackend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import com.gestion.tpbackend.entity.Contrato.MetodoPago;
import com.gestion.tpbackend.entity.Unidad;

import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.time.format.DateTimeFormatter;

@Service
public class EmailService {
    @Autowired
    private JavaMailSender mailSender;
    @Value("${app.frontend.url}")
    private String frontendUrl;

    private String bloqueUnidad(Unidad unidad) {
        StringBuilder sb = new StringBuilder();
        sb.append("Edificio: ").append(unidad.getEdificio().getNombre()).append("\n");
        sb.append("Dirección: ").append(unidad.getEdificio().getDireccion()).append("\n");
        sb.append("Piso/Unidad: ").append(unidad.getPiso()).append(" - Nro ").append(unidad.getPiso()).append("\n");
        return sb.toString();
    }

    private String bloqueNota(String nota) {
        if (nota != null && !nota.isBlank()) {
            return "Nota del inquilino: " + nota + "\n";
        }
        return "";
    }

    public void enviarConfirmacionPago(String email, String nombre,
        List<Map<String, Object>> gastos, MetodoPago metodo, String nota, Unidad unidad) {

        String subject = "Confirmación de Pago - Edificio";
        StringBuilder text = new StringBuilder();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(ZoneId.systemDefault());

        text.append("Hola ").append(nombre).append(",\n\n");
        text.append("Tu pago ha sido registrado exitosamente.\n\n");
        text.append("--- Datos del pago ---\n");
        text.append("Fecha: ").append(formatter.format(Instant.now().atZone(ZoneId.systemDefault()))).append("\n");
        text.append("Método de pago: ").append(metodo.name()).append("\n");
        text.append(bloqueUnidad(unidad));
        text.append(bloqueNota(nota));
        text.append("\nDetalle:\n");

        for (Map<String, Object> gasto : gastos) {
            text.append("- ").append(gasto.get("descripcion")).append(": $").append(gasto.get("monto")).append("\n");
        }

        text.append("\nPuedes ver más detalles en: ").append(frontendUrl).append("/mis-edificios\n");
        text.append("\n¡Gracias por tu pago!");

        enviar(email, subject, text.toString());
    }

    public void enviarAdminConfirmarPago(String email, String nombreAdmin,
        List<Map<String, Object>> gastos, String nombreInquilino,
        MetodoPago metodo, String nota, Unidad unidad) {
        String subject = "Nuevo Pago Registrado - " + unidad.getEdificio().getNombre();
        StringBuilder text = new StringBuilder();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(ZoneId.systemDefault());

        text.append("Hola ").append(nombreAdmin).append(",\n\n");
        text.append("Se ha registrado un nuevo pago.\n\n");
        text.append("--- Datos del pago ---\n");
        text.append("Fecha: ").append(formatter.format(Instant.now().atZone(ZoneId.systemDefault()))).append("\n");
        text.append("Inquilino: ").append(nombreInquilino).append("\n");
        text.append("Método de pago: ").append(metodo.name()).append("\n");
        text.append(bloqueUnidad(unidad));
        text.append(bloqueNota(nota));
        text.append("\nDetalle:\n");

        for (Map<String, Object> gasto : gastos) {
            text.append("- ").append(gasto.get("descripcion")).append(": $").append(gasto.get("monto")).append("\n");
        }

        text.append("\nRevisá el panel: ").append(frontendUrl).append("/building/").append(unidad.getEdificio().getId()).append("\n¡Gracias!");

        enviar(email, subject, text.toString());
    }

    public void enviarPagoEfectivo(String email, String nombre,
        List<Map<String, Object>> gastos, MetodoPago metodo, String nota, Unidad unidad) {
        String subject = "Pago en Efectivo Registrado - Edificio";
        StringBuilder text = new StringBuilder();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(ZoneId.systemDefault());

        text.append("Hola ").append(nombre).append(",\n\n");
        text.append("Tu pago en efectivo fue registrado. Quedará pendiente hasta que el administrador lo confirme.\n\n");
        text.append("--- Datos del pago ---\n");
        text.append("Fecha: ").append(formatter.format(Instant.now().atZone(ZoneId.systemDefault()))).append("\n");
        text.append("Método de pago: ").append(metodo.name()).append("\n");
        text.append(bloqueUnidad(unidad));
        text.append(bloqueNota(nota));
        text.append("\nDetalle:\n");

        for (Map<String, Object> gasto : gastos) {
            text.append("- ").append(gasto.get("descripcion")).append(": $").append(gasto.get("monto")).append("\n");
        }

        text.append("\nVer detalles: ").append(frontendUrl).append("/mis-edificios\n¡Gracias!");

        enviar(email, subject, text.toString());
    }

    public void enviarAdminPagoEfectivo(String email, String nombreAdmin,
        List<Map<String, Object>> gastos, String nombreInquilino,
        MetodoPago metodo, String nota, Unidad unidad) {
        String subject = "Nuevo Pago en Efectivo Pendiente - " + unidad.getEdificio().getNombre();
        StringBuilder text = new StringBuilder();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(ZoneId.systemDefault());

        text.append("Hola ").append(nombreAdmin).append(",\n\n");
        text.append("Se registró un pago en efectivo PENDIENTE de confirmación.\n\n");
        text.append("--- Datos del pago ---\n");
        text.append("Fecha: ").append(formatter.format(Instant.now().atZone(ZoneId.systemDefault()))).append("\n");
        text.append("Inquilino: ").append(nombreInquilino).append("\n");
        text.append("Método de pago: ").append(metodo.name()).append("\n");
        text.append(bloqueUnidad(unidad));
        text.append(bloqueNota(nota));
        text.append("\nDetalle:\n");

        for (Map<String, Object> gasto : gastos) {
            text.append("- ").append(gasto.get("descripcion")).append(": $").append(gasto.get("monto")).append("\n");
        }

        text.append("\nConfirmá el pago en el panel: ").append(frontendUrl).append("/building/").append(unidad.getEdificio().getId()).append("\n\n¡Gracias!");

        enviar(email, subject, text.toString());
    }

    private void enviar(String email, String subject, String text) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject(subject);
        message.setText(text);
        mailSender.send(message);
    }

    public void adminConfirmarEfectivoCliente(String email, String nombre, List<Map<String, Object>> gastos) {
        String subject = "Confirmación de Pago en Efectivo - Edificio";
        StringBuilder text = new StringBuilder();
        text.append("Hola ").append(nombre).append(",\n\n");
        text.append("Tu pago en efectivo ha sido confirmado por el administrador. Aquí están los detalles de tu pago:\n\n");

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(ZoneId.systemDefault());
        text.append("Fecha: ").append(formatter.format(Instant.now().atZone(ZoneId.systemDefault()))).append("\n");

        for (Map<String, Object> gasto : gastos) {
            text.append("- ").append(gasto.get("descripcion")).append(": $").append(gasto.get("monto")).append("\n");
        }

        text.append("\nPuedes ver más detalles en tu perfil: ").append(frontendUrl).append("/mis-edificios\n");
        text.append("\nGracias por tu pago!");

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject(subject);
        message.setText(text.toString());
        mailSender.send(message);
    }

    public void enviarRecordatorio(String email, String nombre, Double deudaPendiente, Unidad unidad, String tiempoRestante) {
        String subject = "Recordatorio de pago - Vence en " + tiempoRestante;
        StringBuilder text = new StringBuilder();

        text.append("Hola ").append(nombre).append(",\n\n");
        text.append("Te recordamos que tu pago vence en ").append(tiempoRestante).append(".\n\n");
        text.append("--- Detalle ---\n");
        text.append("Edificio: ").append(unidad.getEdificio().getNombre()).append("\n");
        text.append("Dirección: ").append(unidad.getEdificio().getDireccion()).append("\n");
        text.append("Piso/Unidad: ").append(unidad.getPiso()).append("\n");
        text.append("Monto pendiente: $").append(deudaPendiente).append("\n\n");
        text.append("Podés abonar desde: ").append(frontendUrl).append("/mis-edificios\n");
        text.append("\nPor favor, realizá el pago antes del vencimiento.");

        enviar(email, subject, text.toString());
    }

    public void enviarRecordatorioUltimodia(String email, String nombre, Double deudaPendiente, Unidad unidad) {
        String subject = "⚠️ Último día para pagar - Vence hoy";
        StringBuilder text = new StringBuilder();

        text.append("Hola ").append(nombre).append(",\n\n");
        text.append("HOY es el último día para realizar tu pago del mes.\n\n");
        text.append("--- Detalle ---\n");
        text.append("Edificio: ").append(unidad.getEdificio().getNombre()).append("\n");
        text.append("Dirección: ").append(unidad.getEdificio().getDireccion()).append("\n");
        text.append("Piso/Unidad: ").append(unidad.getPiso()).append("\n");
        text.append("Monto pendiente: $").append(deudaPendiente).append("\n\n");
        text.append("Aboná ahora: ").append(frontendUrl).append("/mis-edificios\n");
        text.append("\nEvitá inconvenientes realizando el pago hoy.");

        enviar(email, subject, text.toString());
    }

    public void enviarAvisoAumentoAlquiler(String email, String nombre, Unidad unidad,
                                           Double montoAnterior, Double montoAumento, Double montoNuevo,
                                           Double porcentaje, String fechaEfecto, String adminNombre, Double deudaPendiente) {
        String subject = "Aviso: Ajuste de tu alquiler - " + unidad.getEdificio().getNombre();
        StringBuilder text = new StringBuilder();

        text.append("Hola ").append(nombre).append(",\n\n");
        text.append("Te informamos que el alquiler de tu unidad ")
            .append(unidad.getNombre() != null ? unidad.getNombre() : "")
            .append(" en el edificio \"")
            .append(unidad.getEdificio().getNombre())
            .append("\" fue actualizado.\n\n");

        text.append("Resumen del ajuste:\n");
        text.append("- Monto anterior: $").append(montoAnterior).append("\n");
        text.append("- Aumento: $").append(montoAumento).append(" (").append(porcentaje).append("%)\n");
        text.append("- Nuevo monto: $").append(montoNuevo).append("\n");
        text.append("- Fecha de efecto: ").append(fechaEfecto).append("\n\n");

        if (deudaPendiente != null) {
            text.append("Saldo pendiente actual: $").append(deudaPendiente).append("\n\n");
        }

        text.append("Autorizado por: ").append(adminNombre).append("\n\n");
        text.append("Si tenés dudas, respondé este correo o contactá al administrador.");

        enviar(email, subject, text.toString());
    }
}