pipeline{
    agent any
    environment {
            DOCKER_IMAGE = "cjburchell/ridemanagerweb"
            DOCKER_IMAGE_PROCESSOR = "cjburchell/ridemanagerprocessor"
            DOCKER_TAG = "${env.BRANCH_NAME}"
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

        stage('Build image') {
            steps {
                script {
                    if( env.BRANCH_NAME == "master")
                    {
                        docker.build("${DOCKER_IMAGE}").tag("latest")
                        docker.build("${DOCKER_IMAGE_PROCESSOR}", "-f Dockerfile.processor .").tag("latest")
                    } else {
                        docker.build("${DOCKER_IMAGE}").tag("${DOCKER_TAG}")
                        docker.build("${DOCKER_IMAGE_PROCESSOR}", "-f Dockerfile.processor .").tag("${DOCKER_TAG}")
                    }

                }
            }
        }

        stage ('Push image') {
            steps {
                script {
                    docker.withRegistry('https://390282485276.dkr.ecr.us-east-1.amazonaws.com', 'ecr:us-east-1:redpoint-ecr-credentials') {
                                if( env.BRANCH_NAME == "master"){
                                    docker.image("${DOCKER_IMAGE}").push("latest")
                                    docker.image("${DOCKER_IMAGE_PROCESSOR}").push('latest')
                                } else {
                                    docker.image("${DOCKER_IMAGE}").push("${DOCKER_TAG}")
                                     docker.image("${DOCKER_IMAGE_PROCESSOR}").push("${DOCKER_TAG}")
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