package com.infosys.api_gateway.security;

import java.util.Collection;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.authority.mapping.GrantedAuthoritiesMapper;
import org.springframework.security.oauth2.core.oidc.user.OidcUserAuthority;

@Configuration
public class RoleAuthoritiesMapper {

    @Bean
    public GrantedAuthoritiesMapper userAuthoritiesMapper() {

        return (authorities) -> {

            Set<GrantedAuthority> mappedAuthorities = new HashSet<>();

            for (GrantedAuthority authority : authorities) {

                // Keep existing authorities (OIDC_USER, SCOPE_*)
                mappedAuthorities.add(authority);

                if (authority instanceof OidcUserAuthority oidcUserAuthority) {

                    Map<String, Object> claims =
                            oidcUserAuthority.getIdToken().getClaims();

                    Object realmAccess = claims.get("realm_access");

                    if (realmAccess instanceof Map<?, ?> realmMap) {

                        Object roles = realmMap.get("roles");

                        if (roles instanceof Collection<?> roleCollection) {

                            for (Object role : roleCollection) {
                                mappedAuthorities.add(
                                        new SimpleGrantedAuthority("ROLE_" + role.toString())
                                );
                            }
                        }
                    }
                }
            }

            return mappedAuthorities;
        };
    }
}