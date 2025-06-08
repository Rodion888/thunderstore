import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export default async function deploymentRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/deployment/notify', async (request: FastifyRequest<{
    Body: { 
      status: 'success' | 'failed';
      commit?: string;
      branch?: string;
      details?: string;
    }
  }>, reply: FastifyReply) => {
    try {
      const { status, commit, branch, details } = request.body;
      
      let deploymentDetails = '';
      if (commit) deploymentDetails += `\nCommit: ${commit.substring(0, 7)}`;
      if (branch) deploymentDetails += `\nBranch: ${branch}`;
      if (details) deploymentDetails += `\nDetails: ${details}`;
      
      if (fastify.telegramBot) {
        await fastify.telegramBot.sendDeploymentNotification(status, deploymentDetails);
      }
      
      return reply.send({ status: 'ok' });
    } catch (error) {
      fastify.log.error('Error processing deployment notification:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
