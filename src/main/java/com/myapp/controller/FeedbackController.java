package com.myapp.controller;

import com.myapp.dto.ApiResponse;
import com.myapp.dto.FeedbackCreateRequest;
import com.myapp.dto.FeedbackResponse;
import com.myapp.dto.PageResponse;
import com.myapp.service.FeedbackService;
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
public class FeedbackController {
    private final FeedbackService feedbackService;

    /**
     * Create a new feedback
     * POST /api/feedbacks
     */
    @PostMapping
    public ResponseEntity<ApiResponse<FeedbackResponse>> createFeedback(
            @Valid @RequestBody FeedbackCreateRequest request) {

        FeedbackResponse response = feedbackService.createFeedback(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    /**
     * Get feedbacks with pagination and optional username filter
     * GET /api/feedbacks?page=0&size=20&username=xxx
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<FeedbackResponse>>> getFeedbacks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String username) {

        Pageable pageable = PageRequest.of(page, size);
        Page<FeedbackResponse> feedbackPage = feedbackService.getFeedbacks(username, pageable);
        PageResponse<FeedbackResponse> pageResponse = PageResponse.from(feedbackPage);

        return ResponseEntity.ok(ApiResponse.success(pageResponse));
    }
}
