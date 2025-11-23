package com.myapp.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@Tag(name = "Health", description = "헬스 체크 API")
public class HealthController {

    @GetMapping("/health")
    @Operation(
        summary = "기본 헬스 체크",
        description = "ALB와 ECS에서 사용하는 헬스 체크 엔드포인트"
    )
    public ResponseEntity<Map<String, Object>> health() {
        log.debug("Health check requested");

        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "myapp-backend");
        response.put("version", "1.0.0");
        response.put("timestamp", LocalDateTime.now().toString());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/health/detail")
    @Operation(
        summary = "상세 헬스 체크",
        description = "시스템 메모리 및 프로세서 정보를 포함한 상세 헬스 체크"
    )
    public ResponseEntity<Map<String, Object>> healthDetail() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "myapp-backend");
        response.put("version", "1.0.0");
        response.put("timestamp", LocalDateTime.now().toString());

        // 시스템 정보
        Map<String, Object> system = new HashMap<>();
        Runtime runtime = Runtime.getRuntime();
        system.put("totalMemory", runtime.totalMemory() / (1024 * 1024) + " MB");
        system.put("freeMemory", runtime.freeMemory() / (1024 * 1024) + " MB");
        system.put("maxMemory", runtime.maxMemory() / (1024 * 1024) + " MB");
        system.put("processors", runtime.availableProcessors());
        response.put("system", system);

        return ResponseEntity.ok(response);
    }
}
