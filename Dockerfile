FROM openjdk:17-jdk-slim
LABEL authors="anii"
ARG JAR_FILE=target/*.jar
COPY ${JAR_FILE} APP.jar
ENTRYPOINT ["java", "-jar", "APP.jar"]