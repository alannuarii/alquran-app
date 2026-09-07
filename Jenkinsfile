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
                sh '''
                    echo "Downloading portable Node.js to avoid Docker-in-Docker volume mount issues..."
                    curl -fsSL https://nodejs.org/dist/v20.20.2/node-v20.20.2-linux-x64.tar.xz | tar -xJ
                    export PATH="\$(pwd)/node-v20.20.2-linux-x64/bin:\$PATH"
                    
                    npm ci
                    npx drizzle-kit push --force
                '''
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
                sh """
                    sleep 10
                    for i in 1 2 3 4 5; do
                        if docker exec ${DOCKER_IMAGE} wget -qO /dev/null --timeout=5 http://localhost:3000/api/health 2>/dev/null; then
                            echo "Health check passed!"
                            exit 0
                        fi
                        echo "Attempt \$i failed, retrying in 5s..."
                        sleep 5
                    done
                    echo "=== Health check failed. Container logs: ==="
                    docker logs ${DOCKER_IMAGE}
                    exit 1
                """
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
    }
}
