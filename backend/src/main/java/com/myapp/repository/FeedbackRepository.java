package com.myapp.repository;

import com.myapp.model.Feedback;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    /**
     * Find all feedbacks with pagination, sorted by createdAt desc
     */
    Page<Feedback> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /**
     * Find feedbacks by username with pagination, sorted by createdAt desc
     */
    Page<Feedback> findByUsernameOrderByCreatedAtDesc(String username, Pageable pageable);
}
