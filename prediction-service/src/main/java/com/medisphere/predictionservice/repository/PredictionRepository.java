package com.medisphere.predictionservice.repository;

import com.medisphere.predictionservice.model.RiskPrediction;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PredictionRepository extends MongoRepository<RiskPrediction, String> {
}
