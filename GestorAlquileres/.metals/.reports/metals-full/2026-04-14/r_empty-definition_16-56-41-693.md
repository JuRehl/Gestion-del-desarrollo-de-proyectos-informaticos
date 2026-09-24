error id: file://<WORKSPACE>/backend/src/main/java/com/gestion/tpbackend/repository/ContratoRepository.java:org/springframework/data/jpa/repository/JpaRepository#
file://<WORKSPACE>/backend/src/main/java/com/gestion/tpbackend/repository/ContratoRepository.java
empty definition using pc, found symbol in pc: org/springframework/data/jpa/repository/JpaRepository#
empty definition using semanticdb
empty definition using fallback
non-local guesses:

offset: 141
uri: file://<WORKSPACE>/backend/src/main/java/com/gestion/tpbackend/repository/ContratoRepository.java
text:
```scala
package com.gestion.tpbackend.repository;
 
import com.gestion.tpbackend.entity.Contrato;
import org.springframework.data.jpa.repository.JpaR@@epository;
import org.springframework.stereotype.Repository;
 
import java.util.List;
 
@Repository
public interface ContratoRepository extends JpaRepository<Contrato, Long> {
    List<Contrato> findByInquilinoId(Long inquilinoId);
    List<Contrato> findByUnidadEdificioId(Long edificioId);
    List<Contrato> findByUnidadId(Long unidadId);
}
```


#### Short summary: 

empty definition using pc, found symbol in pc: org/springframework/data/jpa/repository/JpaRepository#