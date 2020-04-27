pipeline{
    agent any
    environment {
            DOCKER_IMAGE = "cjburchell/ridemanagerweb"
            DOCKER_IMAGE_PROCESSOR = "cjburchell/ridemanagerprocessor"
            DOCKER_TAG = "${env.BRANCH_NAME}-${env.BUILD_NUMBER}"
    }

    stages{
        stage('Clone repository') {
            steps {
                script{
                    slackSend color: "good", message: "Job: ${env.JOB_NAME} with build number ${env.BUILD_NUMBER} started"
                }
             /* Let's make sure we have the repository cloned to our workspace */
             checkout scm
             }
         }

        stage('Build') {
            steps {
                script {
                    def image = docker.build("${DOCKER_IMAGE}")
                    image.tag("${DOCKER_TAG}")
                    if( env.BRANCH_NAME == "master") {
                        image.tag("latest")
                    }
                }
            }
        }

        stage ('Push') {
            steps {
                script {
                    docker.withRegistry('', 'dockerhub') {
                       def image = docker.image("${DOCKER_IMAGE}")
                       image.push("${DOCKER_TAG}")
                       if( env.BRANCH_NAME == "master") {
                            image.push("latest")
                       }
                    }
                }
            }
        }

        stage('Build Processor') {
            steps {
                script {
                    def image = docker.build("${DOCKER_IMAGE_PROCESSOR}", "-f Dockerfile.processor .")
                    image.tag("${DOCKER_TAG}")
                    if( env.BRANCH_NAME == "master") {
                        image.tag("latest")
                    }
                }
            }
        }

        stage ('Push Processor') {
            steps {
                script {
                    docker.withRegistry('', 'dockerhub') {
                       def image = docker.image("${DOCKER_IMAGE_PROCESSOR}")
                       image.push("${DOCKER_TAG}")
                       if( env.BRANCH_NAME == "master") {
                            image.push("latest")
                       }
                    }
                }
            }
        }
    }

    post {
                always {
                      script{
                          if ( currentBuild.currentResult == "SUCCESS" ) {
                            slackSend color: "good", message: "Job: ${env.JOB_NAME} with build number ${env.BUILD_NUMBER} was successful"
                          }
                          else if( currentBuild.currentResult == "FAILURE" ) {
                            slackSend color: "danger", message: "Job: ${env.JOB_NAME} with build number ${env.BUILD_NUMBER} was failed"
                          }
                          else if( currentBuild.currentResult == "UNSTABLE" ) {
                            slackSend color: "warning", message: "Job: ${env.JOB_NAME} with build number ${env.BUILD_NUMBER} was unstable"
                          }
                          else {
                            slackSend color: "danger", message: "Job: ${env.JOB_NAME} with build number ${env.BUILD_NUMBER} its result (${currentBuild.currentResult}) was unclear"
                          }
                      }
                }
            }

}