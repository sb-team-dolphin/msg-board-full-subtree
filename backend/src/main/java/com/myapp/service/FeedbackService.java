package com.myapp.service;

import com.myapp.dto.FeedbackCreateRequest;
import com.myapp.dto.FeedbackResponse;
import com.myapp.model.Feedback;
import com.myapp.repository.FeedbackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.HtmlUtils;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FeedbackService {
    private static final String ANONYMOUS_USER = "익명";

    private final FeedbackRepository feedbackRepository;

    /**
     * Create a new feedback with XSS protection
     */
    @Transactional
    public FeedbackResponse createFeedback(FeedbackCreateRequest request) {
        // XSS 방지를 위한 HTML escape
        String sanitizedUsername = sanitizeString(request.getUsername());
        String sanitizedMessage = sanitizeString(request.getMessage());

        // username이 비어있으면 익명 처리
        if (sanitizedUsername == null || sanitizedUsername.trim().isEmpty()) {
            sanitizedUsername = ANONYMOUS_USER;
        }

        Feedback feedback = new Feedback(sanitizedUsername, sanitizedMessage);
        Feedback savedFeedback = feedbackRepository.save(feedback);

        return FeedbackResponse.from(savedFeedback);
    }

    /**
     * Get feedbacks with pagination and optional username filter
     */
    public Page<FeedbackResponse> getFeedbacks(String username, Pageable pageable) {
        Page<Feedback> feedbacks;

        if (username != null && !username.trim().isEmpty()) {
            // username으로 필터링
            feedbacks = feedbackRepository.findByUsernameOrderByCreatedAtDesc(username.trim(), pageable);
        } else {
            // 전체 조회
            feedbacks = feedbackRepository.findAllByOrderByCreatedAtDesc(pageable);
        }

        return feedbacks.map(FeedbackResponse::from);
    }

    /**
     * Sanitize string to prevent XSS attacks
     */
    private String sanitizeString(String input) {
        if (input == null) {
            return null;
        }
        return HtmlUtils.htmlEscape(input);
    }
}
