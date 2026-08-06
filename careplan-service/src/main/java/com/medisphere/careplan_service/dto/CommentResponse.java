package com.medisphere.careplan_service.dto;

import java.time.LocalDateTime;

import com.medisphere.careplan_service.model.CarePlanComment;

/**
 * Response DTO representing a CarePlan comment.
 */
public class CommentResponse {

    private String commentId;
    private String author;
    private String authorRole;
    private String message;
    private LocalDateTime createdAt;

    public CommentResponse() {
    }

    public CommentResponse(String commentId, String author, String authorRole, String message, LocalDateTime createdAt) {
        this.commentId = commentId;
        this.author = author;
        this.authorRole = authorRole;
        this.message = message;
        this.createdAt = createdAt;
    }

    public static CommentResponse fromComment(CarePlanComment comment) {
        if (comment == null) return null;
        return new CommentResponse(
                comment.getCommentId(),
                comment.getAuthor(),
                comment.getAuthorRole(),
                comment.getMessage(),
                comment.getCreatedAt()
        );
    }

    public String getCommentId() {
        return commentId;
    }

    public void setCommentId(String commentId) {
        this.commentId = commentId;
    }

    public String getAuthor() {
        return author;
    }

    public void setAuthor(String author) {
        this.author = author;
    }

    public String getAuthorRole() {
        return authorRole;
    }

    public void setAuthorRole(String authorRole) {
        this.authorRole = authorRole;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
