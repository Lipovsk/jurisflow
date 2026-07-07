package com.jurisflow.jurisflow.security;

import com.jurisflow.jurisflow.model.Usuario;
import org.springframework.stereotype.Service;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class JwtService {

    private static final String HMAC_ALG = "HmacSHA256";
    private static final Base64.Encoder B64_URL_ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder B64_URL_DECODER = Base64.getUrlDecoder();

    private final JsonMapper jsonMapper;
    private final byte[] secret;
    private final long expirationMinutes;

    public JwtService(JsonMapper jsonMapper) {
        this.jsonMapper = jsonMapper;
        String rawSecret = System.getenv("JWT_SECRET");
        if (rawSecret == null || rawSecret.isBlank()) {
            throw new IllegalStateException("JWT_SECRET nao configurado. Defina a variavel de ambiente antes de iniciar o backend.");
        }
        this.secret = rawSecret.getBytes(StandardCharsets.UTF_8);
        if (this.secret.length < 32) {
            throw new IllegalStateException("JWT_SECRET deve ter no minimo 32 bytes em UTF-8.");
        }
        this.expirationMinutes = parseExpiration(System.getenv("JWT_EXPIRATION_MINUTES"));
    }

    public TokenGerado gerarToken(Usuario usuario) {
        Instant expiresAt = Instant.now().plusSeconds(expirationMinutes * 60);

        Map<String, Object> header = new LinkedHashMap<>();
        header.put("alg", "HS256");
        header.put("typ", "JWT");

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("sub", String.valueOf(usuario.getId()));
        payload.put("id", usuario.getId());
        payload.put("email", usuario.getEmail());
        payload.put("perfil", usuario.getPerfil().name());
        payload.put("exp", expiresAt.getEpochSecond());

        String token = encodeJson(header) + "." + encodeJson(payload);
        token = token + "." + assinar(token);
        return new TokenGerado(token, expiresAt);
    }

    public Claims validar(String token) {
        if (token == null || token.isBlank()) {
            throw new JwtInvalidoException("Token ausente.");
        }

        String[] partes = token.split("\\.");
        if (partes.length != 3) {
            throw new JwtInvalidoException("Token invalido.");
        }

        String conteudoAssinado = partes[0] + "." + partes[1];
        String assinaturaEsperada = assinar(conteudoAssinado);
        if (!constantTimeEquals(assinaturaEsperada, partes[2])) {
            throw new JwtInvalidoException("Token invalido.");
        }

        Map<String, Object> payload = decodeJson(partes[1]);
        long exp = ((Number) payload.getOrDefault("exp", 0)).longValue();
        if (Instant.now().getEpochSecond() >= exp) {
            throw new JwtInvalidoException("Token expirado.");
        }

        Long id = Long.valueOf(String.valueOf(payload.get("id")));
        String email = String.valueOf(payload.get("email"));
        String perfil = String.valueOf(payload.get("perfil"));
        return new Claims(id, email, perfil, Instant.ofEpochSecond(exp));
    }

    private long parseExpiration(String raw) {
        if (raw == null || raw.isBlank()) return 480L;
        try {
            long minutes = Long.parseLong(raw);
            return minutes > 0 ? minutes : 480L;
        } catch (NumberFormatException ex) {
            return 480L;
        }
    }

    private String encodeJson(Map<String, Object> value) {
        try {
            return B64_URL_ENCODER.encodeToString(jsonMapper.writeValueAsBytes(value));
        } catch (Exception ex) {
            throw new JwtInvalidoException("Nao foi possivel gerar token.");
        }
    }

    private Map<String, Object> decodeJson(String value) {
        try {
            byte[] json = B64_URL_DECODER.decode(value);
            return jsonMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception ex) {
            throw new JwtInvalidoException("Token invalido.");
        }
    }

    private String assinar(String value) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALG);
            mac.init(new SecretKeySpec(secret, HMAC_ALG));
            return B64_URL_ENCODER.encodeToString(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new JwtInvalidoException("Nao foi possivel assinar token.");
        }
    }

    private boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null) return false;
        byte[] left = a.getBytes(StandardCharsets.UTF_8);
        byte[] right = b.getBytes(StandardCharsets.UTF_8);
        if (left.length != right.length) return false;

        int result = 0;
        for (int i = 0; i < left.length; i += 1) {
            result |= left[i] ^ right[i];
        }
        return result == 0;
    }

    public record TokenGerado(String token, Instant expiresAt) {}
    public record Claims(Long id, String email, String perfil, Instant expiresAt) {}

    public static class JwtInvalidoException extends RuntimeException {
        public JwtInvalidoException(String message) {
            super(message);
        }
    }
}
