# Implémentation Backend Spring Boot pour Notifications FCM

## Prérequis
- Projet Spring Boot avec Firebase Admin SDK
- Configuration Firebase dans `application.properties`

## Dépendances Maven
Ajoutez dans `pom.xml` :
```xml
<dependency>
    <groupId>com.google.firebase</groupId>
    <artifactId>firebase-admin</artifactId>
    <version>9.2.0</version>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
    <groupId>com.google.cloud</groupId>
    <artifactId>google-cloud-firestore</artifactId>
</dependency>
```

## Configuration Firebase
Placez votre clé de service Firebase (`serviceAccountKey.json`) dans `src/main/resources/`.

Dans `application.properties` :
```
firebase.config.path=classpath:serviceAccountKey.json
```

## Service de Notification
```java
@Service
public class NotificationService {

    @Autowired
    private Firestore firestore;

    public void sendNotificationToUser(String userEmail, String title, String body) throws Exception {
        // Récupérer le token FCM depuis Firestore
        DocumentReference docRef = firestore.collection("fcmTokens").document(userEmail);
        ApiFuture<DocumentSnapshot> future = docRef.get();
        DocumentSnapshot document = future.get();

        if (document.exists()) {
            String fcmToken = document.getString("fcmToken");
            if (fcmToken != null) {
                // Créer le message
                Message message = Message.builder()
                    .setToken(fcmToken)
                    .setNotification(Notification.builder()
                        .setTitle(title)
                        .setBody(body)
                        .build())
                    .build();

                // Envoyer via FCM
                String response = FirebaseMessaging.getInstance().send(message);
                System.out.println("Notification envoyée: " + response);
            }
        }
    }
}
```

## Contrôleur REST
```java
@RestController
@RequestMapping("/api")
public class SignalementController {

    @Autowired
    private NotificationService notificationService;

    @PostMapping("/signalement-statut")
    public ResponseEntity<?> createSignalementStatut(@RequestBody SignalementStatutRequest request) {
        // Logique pour créer le signalement statut
        // ...

        // Envoyer notification à l'utilisateur
        try {
            notificationService.sendNotificationToUser(
                request.getUserId(),
                "Nouveau signalement",
                "Un nouveau signalement a été créé pour vous."
            );
        } catch (Exception e) {
            // Gérer l'erreur
        }

        return ResponseEntity.ok().build();
    }
}
```

## Classe de Configuration Firebase
```java
@Configuration
public class FirebaseConfig {

    @Value("${firebase.config.path}")
    private String firebaseConfigPath;

    @Bean
    public Firestore firestore() throws IOException {
        GoogleCredentials credentials = GoogleCredentials.fromStream(
            new ClassPathResource(firebaseConfigPath).getInputStream()
        );
        FirebaseOptions options = FirebaseOptions.builder()
            .setCredentials(credentials)
            .build();
        FirebaseApp.initializeApp(options);
        return FirestoreClient.getFirestore();
    }
}
```

## Modèle SignalementStatutRequest
```java
public class SignalementStatutRequest {
    private String userId;
    // autres champs...

    // getters et setters
}
```</content>
<parameter name="filePath">/home/zark/Bureau/ITU/Annee-3/Cloud/Project/route-front-end-vue/BACKEND_IMPLEMENTATION.md