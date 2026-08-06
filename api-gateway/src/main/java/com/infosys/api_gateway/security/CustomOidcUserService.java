package com.infosys.api_gateway.security;

import java.util.Collection;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

@Service
public class CustomOidcUserService extends OidcUserService {

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) {

        OidcUser oidcUser = super.loadUser(userRequest);

        Set<GrantedAuthority> mappedAuthorities = new HashSet<>();

        Collection<? extends GrantedAuthority> authorities = oidcUser.getAuthorities();

        mappedAuthorities.addAll(authorities);

        Map<String, Object> realmAccess =
                oidcUser.getClaimAsMap("realm_access");

        if (realmAccess != null) {

            Object roles = realmAccess.get("roles");

            if (roles instanceof Collection<?> roleCollection) {

                roleCollection.forEach(role ->
                        mappedAuthorities.add(
                                new SimpleGrantedAuthority("ROLE_" + role.toString())
                        ));
            }
        }

        return new DefaultOidcUser(
                mappedAuthorities,
                oidcUser.getIdToken(),
                oidcUser.getUserInfo()
        );
    }
}