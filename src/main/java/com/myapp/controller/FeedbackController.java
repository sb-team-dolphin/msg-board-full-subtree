package com.myapp.controller;

import com.myapp.dto.ApiResponse;
import com.myapp.dto.FeedbackCreateRequest;
import com.myapp.dto.FeedbackResponse;
import com.myapp.dto.PageResponse;
import com.myapp.service.FeedbackService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/feedbacks")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Tag(name = "Feedback", description = "피드백 관리 API")
public class FeedbackController {
    private final FeedbackService feedbackService;

    @PostMapping
    @Operation(
        summary = "피드백 생성",
        description = "새로운 피드백을 생성합니다."
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "201",
            description = "피드백 생성 성공",
            content = @Content(schema = @Schema(implementation = FeedbackResponse.class))
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "400",
            description = "잘못된 요청"
        )
    })
    public ResponseEntity<ApiResponse<FeedbackResponse>> createFeedback(
            @Valid @RequestBody FeedbackCreateRequest request) {

        FeedbackResponse response = feedbackService.createFeedback(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(
        summary = "피드백 목록 조회",
        description = "페이지네이션 및 사용자명 필터를 사용하여 피드백 목록을 조회합니다."
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200",
            description = "조회 성공"
        )
    })
    public ResponseEntity<ApiResponse<PageResponse<FeedbackResponse>>> getFeedbacks(
            @Parameter(description = "페이지 번호 (0부터 시작)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "페이지 크기")
            @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "사용자명 필터 (선택사항)")
            @RequestParam(required = false) String username) {

        Pageable pageable = PageRequest.of(page, size);
        Page<FeedbackResponse> feedbackPage = feedbackService.getFeedbacks(username, pageable);
        PageResponse<FeedbackResponse> pageResponse = PageResponse.from(feedbackPage);

        return ResponseEntity.ok(ApiResponse.success(pageResponse));
    }
}
