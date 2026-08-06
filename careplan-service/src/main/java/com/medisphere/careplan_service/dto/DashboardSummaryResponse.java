package com.medisphere.careplan_service.dto;

/**
 * DTO representing aggregated summary KPIs for the Analytics Dashboard.
 */
public class DashboardSummaryResponse {

    private long totalCarePlans;
    private long activeCarePlans;
    private long pendingApproval;
    private long approvedCarePlans;
    private long rejectedCarePlans;
    private double averageAdherence;
    private double averageRiskReduction;
    private long highRiskPatients;
    private long moderateRiskPatients;
    private long lowRiskPatients;
    private long completedCarePlans;

    public DashboardSummaryResponse() {
    }

    public DashboardSummaryResponse(long totalCarePlans,
                                    long activeCarePlans,
                                    long pendingApproval,
                                    long approvedCarePlans,
                                    long rejectedCarePlans,
                                    double averageAdherence,
                                    double averageRiskReduction,
                                    long highRiskPatients,
                                    long moderateRiskPatients,
                                    long lowRiskPatients,
                                    long completedCarePlans) {
        this.totalCarePlans = totalCarePlans;
        this.activeCarePlans = activeCarePlans;
        this.pendingApproval = pendingApproval;
        this.approvedCarePlans = approvedCarePlans;
        this.rejectedCarePlans = rejectedCarePlans;
        this.averageAdherence = averageAdherence;
        this.averageRiskReduction = averageRiskReduction;
        this.highRiskPatients = highRiskPatients;
        this.moderateRiskPatients = moderateRiskPatients;
        this.lowRiskPatients = lowRiskPatients;
        this.completedCarePlans = completedCarePlans;
    }

    public long getTotalCarePlans() {
        return totalCarePlans;
    }

    public void setTotalCarePlans(long totalCarePlans) {
        this.totalCarePlans = totalCarePlans;
    }

    public long getActiveCarePlans() {
        return activeCarePlans;
    }

    public void setActiveCarePlans(long activeCarePlans) {
        this.activeCarePlans = activeCarePlans;
    }

    public long getPendingApproval() {
        return pendingApproval;
    }

    public void setPendingApproval(long pendingApproval) {
        this.pendingApproval = pendingApproval;
    }

    public long getApprovedCarePlans() {
        return approvedCarePlans;
    }

    public void setApprovedCarePlans(long approvedCarePlans) {
        this.approvedCarePlans = approvedCarePlans;
    }

    public long getRejectedCarePlans() {
        return rejectedCarePlans;
    }

    public void setRejectedCarePlans(long rejectedCarePlans) {
        this.rejectedCarePlans = rejectedCarePlans;
    }

    public double getAverageAdherence() {
        return averageAdherence;
    }

    public void setAverageAdherence(double averageAdherence) {
        this.averageAdherence = averageAdherence;
    }

    public double getAverageRiskReduction() {
        return averageRiskReduction;
    }

    public void setAverageRiskReduction(double averageRiskReduction) {
        this.averageRiskReduction = averageRiskReduction;
    }

    public long getHighRiskPatients() {
        return highRiskPatients;
    }

    public void setHighRiskPatients(long highRiskPatients) {
        this.highRiskPatients = highRiskPatients;
    }

    public long getModerateRiskPatients() {
        return moderateRiskPatients;
    }

    public void setModerateRiskPatients(long moderateRiskPatients) {
        this.moderateRiskPatients = moderateRiskPatients;
    }

    public long getLowRiskPatients() {
        return lowRiskPatients;
    }

    public void setLowRiskPatients(long lowRiskPatients) {
        this.lowRiskPatients = lowRiskPatients;
    }

    public long getCompletedCarePlans() {
        return completedCarePlans;
    }

    public void setCompletedCarePlans(long completedCarePlans) {
        this.completedCarePlans = completedCarePlans;
    }
}
