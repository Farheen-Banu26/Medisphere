package com.medisphere.careplan_service.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request payload for POST /api/careplans/{carePlanId}/comments
 */
public class AddCommentRequest {

    @NotBlank(message = "author is required")
    private String author;

    @NotBlank(message = "authorRole is required")
    private String authorRole;

    @NotBlank(message = "message must not be blank")
    private String message;

    public AddCommentRequest() {
    }

    public AddCommentRequest(String author, String authorRole, String message) {
        this.author = author;
        this.authorRole = authorRole;
        this.message = message;
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
}
