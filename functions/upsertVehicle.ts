export default async function({ id, data }) {
    if (id) {
        return await base44.asServiceRole.entities.Vehicle.update(id, data);
    } else {
        return await base44.asServiceRole.entities.Vehicle.create(data);
    }
}