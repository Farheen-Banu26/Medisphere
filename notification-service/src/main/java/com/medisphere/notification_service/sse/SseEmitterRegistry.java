package com.medisphere.notification_service.sse;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.medisphere.notification_service.dto.NotificationEvent;

/**
 * Thread-safe registry of active SSE connections.
 * Allows notification-stream Kafka consumer to push events to all connected browser clients.
 */
@Component
public class SseEmitterRegistry {

    private static final Logger logger = LoggerFactory.getLogger(SseEmitterRegistry.class);
    private static final long SSE_TIMEOUT_MS = 5 * 60 * 1000L; // 5 minutes

    private final Map<Long, SseEmitter> emitters = new ConcurrentHashMap<>();
    private final AtomicLong counter = new AtomicLong();

    /**
     * Create and register a new SSE emitter for a browser client.
     */
    public SseEmitter createEmitter() {
        long id = counter.incrementAndGet();
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT_MS);
        emitters.put(id, emitter);

        emitter.onCompletion(() -> {
            emitters.remove(id);
            logger.debug("SSE emitter {} completed", id);
        });
        emitter.onTimeout(() -> {
            emitters.remove(id);
            logger.debug("SSE emitter {} timed out", id);
        });
        emitter.onError((ex) -> {
            emitters.remove(id);
            logger.debug("SSE emitter {} errored: {}", id, ex.getMessage());
        });

        logger.info("SSE emitter {} registered. Active emitters: {}", id, emitters.size());

        try {
            emitter.send(SseEmitter.event().name("init").data("connected"));
        } catch (IOException e) {
            logger.debug("Failed to send initial SSE connect event for emitter {}: {}", id, e.getMessage());
            emitters.remove(id);
        }

        return emitter;
    }

    /**
     * Broadcast a notification event to all active SSE connections.
     */
    public void broadcast(NotificationEvent event) {
        if (emitters.isEmpty()) {
            return;
        }
        emitters.forEach((id, emitter) -> {
            try {
                emitter.send(
                    SseEmitter.event()
                        .name("notification")
                        .data(event)
                );
            } catch (IOException ex) {
                logger.debug("SSE send failed for emitter {}, removing: {}", id, ex.getMessage());
                emitters.remove(id);
            }
        });
        logger.info("Broadcast notification {} to {} SSE client(s)", event.getNotificationId(), emitters.size());
    }

    public int activeCount() {
        return emitters.size();
    }
}
