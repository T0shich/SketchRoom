import { FabricObject } from 'fabric'
const SOCKET_OBJECT_ID = 'socketObjectId'

type SocketObjectData = Record<string, unknown> & { socketObjectId?: string }

export const createSocketObjectId = () =>
	`${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

// Возвращает socketObjectId из Fabric-объекта или сериализованных данных.
export const getSocketObjectId = (
	object: FabricObject | SocketObjectData | null | undefined,
) => {
	if (!object) return undefined
	if (object instanceof FabricObject) {
		const value = object.get(SOCKET_OBJECT_ID)
		return typeof value === 'string' ? value : undefined
	}

	const value = object[SOCKET_OBJECT_ID]
	return typeof value === 'string' ? value : undefined
}

// Гарантирует наличие socketObjectId у объекта и возвращает его.
export const ensureSocketObjectId = (object: FabricObject) => {
	let objectId = getSocketObjectId(object)
	if (!objectId) {
		objectId = createSocketObjectId()
		object.set(SOCKET_OBJECT_ID, objectId)
	}
	return objectId
}

// Сериализует объект для передачи по сокету с нужными дополнительными полями.
export const serializeObject = (object: FabricObject) => {
	ensureSocketObjectId(object)
	return object.toObject([
		SOCKET_OBJECT_ID,
		'globalCompositeOperation',
	]) as SocketObjectData
}

// Проверяет пересечение двух объектов по их bounding box.
export const isIntersecting = (first: FabricObject, second: FabricObject) => {
	const firstRect = first.getBoundingRect()
	const secondRect = second.getBoundingRect()

	return !(
		firstRect.left + firstRect.width < secondRect.left ||
		secondRect.left + secondRect.width < firstRect.left ||
		firstRect.top + firstRect.height < secondRect.top ||
		secondRect.top + secondRect.height < firstRect.top
	)
}
