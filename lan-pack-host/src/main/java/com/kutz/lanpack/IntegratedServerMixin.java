package com.kutz.lanpack;

import net.minecraft.client.server.IntegratedServer;
import net.minecraft.network.chat.Component;
import net.minecraft.server.MinecraftServer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfoReturnable;

@Mixin(IntegratedServer.class)
public abstract class IntegratedServerMixin {
	private static final Logger LOGGER = LoggerFactory.getLogger("lanpackhost");

	@Inject(method = "publishServer(Lnet/minecraft/server/MinecraftServer$MultiplayerScope;I)Z", at = @At("RETURN"))
	private void lanpackhost$startPackHost(MinecraftServer.MultiplayerScope scope, int port, CallbackInfoReturnable<Boolean> callback) {
		if (!Boolean.TRUE.equals(callback.getReturnValue())) {
			return;
		}

		MinecraftServer server = (MinecraftServer) (Object) this;
		server.execute(() -> {
			run(server, "/automodpack generate");
			server.getPlayerList().broadcastSystemMessage(
				Component.literal("Pack download is starting for this LAN world."),
				false
			);
		});

		Thread.ofPlatform().daemon().name("lan-pack-host").start(() -> {
			try {
				Thread.sleep(8000);
			} catch (InterruptedException interrupted) {
				Thread.currentThread().interrupt();
				return;
			}
			if (!server.isPublished() || server.isStopped()) {
				return;
			}
			server.execute(() -> run(server, "/automodpack host restart"));
		});
	}

	private static void run(MinecraftServer server, String command) {
		try {
			server.getCommands().performPrefixedCommand(server.createCommandSourceStack(), command);
			LOGGER.info("Ran {}", command);
			java.nio.file.Files.writeString(java.nio.file.Path.of("/tmp/lanpack-test.log"), "ran " + command + "\n", java.nio.file.StandardOpenOption.CREATE, java.nio.file.StandardOpenOption.APPEND);
		} catch (Throwable failure) {
			LOGGER.warn("Could not run {}", command, failure);
			try {
				java.nio.file.Files.writeString(java.nio.file.Path.of("/tmp/lanpack-test.log"), "failed " + command + " " + failure + "\n", java.nio.file.StandardOpenOption.CREATE, java.nio.file.StandardOpenOption.APPEND);
			} catch (Throwable ignored) {
			}
		}
	}
}
