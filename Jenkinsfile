pipeline {
    agent any

    environment {
        DOCKER_IMAGE = 'alquran-app'
        DOCKER_PORT = '3019'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Load Environment Variables') {
            steps {
                withCredentials([file(credentialsId: 'alquran-env', variable: 'ENV_FILE')]) {
                    sh 'cp $ENV_FILE .env'
                }
            }
        }

        stage('Drizzle Database Push') {
            steps {
                sh 'npm ci'
                sh 'npx drizzle-kit push'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${DOCKER_IMAGE}:latest ."
            }
        }

        stage('Deploy Container') {
            steps {
                sh """
                docker stop ${DOCKER_IMAGE} || true
                docker rm ${DOCKER_IMAGE} || true
                docker run -d --name ${DOCKER_IMAGE} --restart always -p ${DOCKER_PORT}:3000 --env-file .env ${DOCKER_IMAGE}:latest
                """
            }
        }

        stage('Health Check') {
            steps {
                sleep 5
                sh "curl -f http://localhost:${DOCKER_PORT}/ || exit 1"
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
    }
}
