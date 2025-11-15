// socket/packOpeningHandlers.js
class PackOpeningHandlers {
    async handleOpenPack(socket, data) {
      try {
        const { battleId, round = 1 } = data;
        
        const battle = await BattleModel.findById(battleId).populate('packsIds');
        const battleSession = await BattleSessionModel.findOne({ battleId });
        
        if (!battle || !battleSession) {
          socket.emit('error', { message: 'Battle not found' });
          return;
        }
  
        // Simulate pack opening with animation delays
        const packResults = await this.simulatePackOpeningWithAnimation(
          battle.packsIds[0], 
          socket.userId, 
          battleId, 
          round
        );
  
        // Update battle session
        await this.updateBattleSession(battleSession, socket.userId, packResults, round);
  
        // Get updated battle state
        const battleState = await this.getBattleState(battleId);
  
        // Broadcast results to all battle participants
        socketManager.io.to(`battle_${battleId}`).emit('pack_opened', {
          userId: socket.userId,
          round,
          results: packResults,
          battleState
        });
  
        // Check if round is complete
        await this.checkRoundCompletion(battleId, round);
  
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    }
  
    async simulatePackOpeningWithAnimation(pack, userId, battleId, round) {
      const items = [];
      const totalItems = pack.packAmount;
      
      // Simulate each item opening with delays for animation
      for (let i = 0; i < totalItems; i++) {
        const item = this.getRandomItem(pack.items);
        items.push(item);
        
        // Emit individual item reveal with delay
        setTimeout(() => {
          socketManager.io.to(`battle_${battleId}`).emit('item_reveal', {
            userId,
            round,
            itemIndex: i,
            item,
            isLast: i === totalItems - 1
          });
        }, i * 800); // 800ms between each item reveal
      }
  
      return {
        items,
        totalValue: items.reduce((sum, item) => sum + item.value, 0),
        round
      };
    }
  
    async checkRoundCompletion(battleId, round) {
      const battleSession = await BattleSessionModel.findOne({ battleId });
      const battle = await BattleModel.findById(battleId);
      
      const roundOpenings = battleSession.packOpenings.filter(
        opening => opening.round === round
      );
      
      // Check if all players have opened packs this round
      if (roundOpenings.length === battle.players.length) {
        // All players completed this round
        socketManager.io.to(`battle_${battleId}`).emit('round_completed', {
          round,
          battleState: await this.getBattleState(battleId)
        });
  
        // Check if battle is complete
        if (round >= battle.rounds) {
          await this.completeBattle(battleId);
        } else {
          // Start next round after delay
          setTimeout(() => {
            socketManager.io.to(`battle_${battleId}`).emit('round_start', {
              round: round + 1
            });
          }, 3000);
        }
      }
    }
  
    async completeBattle(battleId) {
      const battle = await BattleModel.findById(battleId);
      const battleSession = await BattleSessionModel.findOne({ battleId });
      
      // Calculate winner based on game mode
      const winner = await calculateWinner(battle, battleSession);
      
      // Update battle with results
      battle.status = 'completed';
      battle.completedAt = new Date();
      battle.results = {
        winner: winner.userId,
        prizeDistribution: battleSession.playerStats,
        jackpotPool: battleSession.jackpotPool,
        totalPrize: battleSession.playerStats.reduce((sum, stat) => sum + stat.totalValue, 0)
      };
      await battle.save();
  
      // Broadcast results
      socketManager.io.to(`battle_${battleId}`).emit('battle_completed', {
        winner: winner.userId,
        results: battle.results,
        battleState: await this.getBattleState(battleId)
      });
  
      // Clean up room after delay
      setTimeout(() => {
        socketManager.battleRooms.delete(battleId);
      }, 30000); // 30 seconds
    }
  }