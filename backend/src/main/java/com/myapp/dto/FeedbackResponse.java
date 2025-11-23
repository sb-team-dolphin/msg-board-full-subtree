package com.myapp.dto;

import com.myapp.model.Feedback;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackResponse {
    private Long id;
    private String username;
    private String message;
    private LocalDateTime createdAt;

    public static FeedbackResponse from(Feedback feedback) {
        return new FeedbackResponse(
            feedback.getId(),
            feedback.getUsername(),
            feedback.getMessage(),
            feedback.getCreatedAt()
        );
    }
}
