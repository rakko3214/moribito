import { ConditionalCheckFailedException, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { saveDataV1Schema, type SaveDataV1 } from "@moribito/shared";
import type { SaveRepository } from "./SaveRepository.js";

export class DynamoSaveRepository implements SaveRepository {
  constructor(private readonly tableName: string, private readonly client = DynamoDBDocumentClient.from(new DynamoDBClient({}))) {}
  async get(userId: string) {
    const result = await this.client.send(new GetCommand({ TableName: this.tableName, Key: { userId }, ProjectionExpression: "#current", ExpressionAttributeNames: { "#current": "current" } }));
    return result.Item?.current ? saveDataV1Schema.parse(result.Item.current) : null;
  }
  async put(userId: string, baseRevision: number, save: SaveDataV1) {
    const next = { ...save, revision: baseRevision + 1, savedAt: new Date().toISOString() };
    try {
      await this.client.send(new UpdateCommand({
        TableName: this.tableName,
        Key: { userId },
        UpdateExpression: baseRevision === 0 ? "SET #current = :next, revision = :nextRevision" : "SET #previous = #current, #current = :next, revision = :nextRevision",
        ConditionExpression: baseRevision === 0 ? "attribute_not_exists(#current)" : "revision = :baseRevision",
        ExpressionAttributeNames: { "#current": "current", ...(baseRevision === 0 ? {} : { "#previous": "previous" }) },
        ExpressionAttributeValues: { ":next": next, ":nextRevision": next.revision, ...(baseRevision === 0 ? {} : { ":baseRevision": baseRevision }) },
      }));
      return next;
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException || (error as { name?: string }).name === "ConditionalCheckFailedException") return "conflict";
      throw error;
    }
  }
  async reset(userId: string) {
    try {
      await this.client.send(new UpdateCommand({ TableName: this.tableName, Key: { userId }, UpdateExpression: "SET #previous = #current REMOVE #current, revision", ConditionExpression: "attribute_exists(#current)", ExpressionAttributeNames: { "#current": "current", "#previous": "previous" } }));
    } catch (error) {
      if (!(error instanceof ConditionalCheckFailedException) && (error as { name?: string }).name !== "ConditionalCheckFailedException") throw error;
    }
  }
}
