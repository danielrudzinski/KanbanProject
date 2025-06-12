package pl.myproject.kanbanproject2.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.HandlerExceptionResolver;
import pl.myproject.kanbanproject2.service.JwtService;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final HandlerExceptionResolver handlerExceptionResolver;

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            UserDetailsService userDetailsService,
            HandlerExceptionResolver handlerExceptionResolver
    ) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.handlerExceptionResolver = handlerExceptionResolver;
    }

    @Override
protected void doFilterInternal(
        @NonNull HttpServletRequest request,
        @NonNull HttpServletResponse response,
        @NonNull FilterChain filterChain
) throws ServletException, IOException {
    
    String requestPath = request.getRequestURI();
    String method = request.getMethod();
    String origin = request.getHeader("Origin");
    
    System.out.println("JWT Filter - Processing: " + method + " " + requestPath + " from: " + origin);
    
    if (shouldSkipFilter(requestPath, method)) {
        System.out.println("JWT Filter - Skipping for: " + requestPath);
        filterChain.doFilter(request, response);
        return;
    }
    
    final String authHeader = request.getHeader("Authorization");

    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
        filterChain.doFilter(request, response);
        return;
    }

    try {
        final String jwt = authHeader.substring(7);
        final String userEmail = jwtService.extractUsername(jwt);

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (userEmail != null && authentication == null) {
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);

            if (jwtService.isTokenValid(jwt, userDetails)) {
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );

                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        filterChain.doFilter(request, response);
    } catch (Exception exception) {
        System.err.println("JWT Filter error: " + exception.getMessage());
        handlerExceptionResolver.resolveException(request, response, null, exception);
    }
}

private boolean shouldSkipFilter(String requestPath, String method) {
    return requestPath.startsWith("/auth/") || 
           requestPath.startsWith("/actuator/") ||
           requestPath.startsWith("/ws/") ||
           requestPath.equals("/chat") ||
           "OPTIONS".equals(method) ||
           requestPath.matches(".*\\.(html|js|css|ico|json|png|svg|jpg|jpeg|gif|webp|woff|woff2|ttf)$");
}

}