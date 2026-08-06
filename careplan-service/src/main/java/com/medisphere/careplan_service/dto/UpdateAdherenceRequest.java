package com.medisphere.careplan_service.dto;

/**
 * Request DTO for updating daily care plan activity completion and recalculating adherence.
 */
public class UpdateAdherenceRequest {

    private Boolean medicineTaken;
    private Boolean exerciseCompleted;
    private Boolean dietFollowed;
    private Boolean waterGoalCompleted;
    private Boolean sleepGoalCompleted;
    private Boolean bpChecked;
    private Boolean glucoseChecked;

    public UpdateAdherenceRequest() {
    }

    public UpdateAdherenceRequest(Boolean medicineTaken,
                                  Boolean exerciseCompleted,
                                  Boolean dietFollowed,
                                  Boolean waterGoalCompleted,
                                  Boolean sleepGoalCompleted,
                                  Boolean bpChecked,
                                  Boolean glucoseChecked) {
        this.medicineTaken = medicineTaken;
        this.exerciseCompleted = exerciseCompleted;
        this.dietFollowed = dietFollowed;
        this.waterGoalCompleted = waterGoalCompleted;
        this.sleepGoalCompleted = sleepGoalCompleted;
        this.bpChecked = bpChecked;
        this.glucoseChecked = glucoseChecked;
    }

    public Boolean getMedicineTaken() {
        return medicineTaken;
    }

    public void setMedicineTaken(Boolean medicineTaken) {
        this.medicineTaken = medicineTaken;
    }

    public Boolean getExerciseCompleted() {
        return exerciseCompleted;
    }

    public void setExerciseCompleted(Boolean exerciseCompleted) {
        this.exerciseCompleted = exerciseCompleted;
    }

    public Boolean getDietFollowed() {
        return dietFollowed;
    }

    public void setDietFollowed(Boolean dietFollowed) {
        this.dietFollowed = dietFollowed;
    }

    public Boolean getWaterGoalCompleted() {
        return waterGoalCompleted;
    }

    public void setWaterGoalCompleted(Boolean waterGoalCompleted) {
        this.waterGoalCompleted = waterGoalCompleted;
    }

    public Boolean getSleepGoalCompleted() {
        return sleepGoalCompleted;
    }

    public void setSleepGoalCompleted(Boolean sleepGoalCompleted) {
        this.sleepGoalCompleted = sleepGoalCompleted;
    }

    public Boolean getBpChecked() {
        return bpChecked;
    }

    public void setBpChecked(Boolean bpChecked) {
        this.bpChecked = bpChecked;
    }

    public Boolean getGlucoseChecked() {
        return glucoseChecked;
    }

    public void setGlucoseChecked(Boolean glucoseChecked) {
        this.glucoseChecked = glucoseChecked;
    }
}
