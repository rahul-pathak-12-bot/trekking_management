const { createApp, ref, reactive, computed, onMounted } = Vue;
const { createRouter, createWebHashHistory, useRouter, useRoute } = VueRouter;

// port
const API_BASE = "http://localhost:5000";

// API HELPER

async function api(path, method = "GET", body = null) {
  const headers = { "Content-Type": "application/json" };
  const token = auth.token;
  if (token) headers["Authorization"] = "Bearer " + token;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(API_BASE + path, options);

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

// AUTH STORE
const auth = reactive({
  token: localStorage.getItem("token") || null,
  user: JSON.parse(localStorage.getItem("user") || "null"),

  login(token, user) {
    this.token = token;
    this.user = user;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
  },
  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },
  get role() {
    return this.user ? this.user.role : null;
  },
});

// SHARED LAYOUT

const DashboardLayout = {
  props: ["links", "title"],
  setup() {
    const router = useRouter();
    const route = useRoute();
    const doLogout = () => {
      auth.logout();
      router.push("/login");
    };
    return { auth, route, doLogout };
  },
  template: ` <div class="d-flex">
    <div class="sidebar bg-white shadow-sm p-3" style="width:260px;min-height:100vh;">
        <div class="text-center mb-4">
            
            <h2 class="fw-bold mt-2"> TREK IT </h2>
            <small class="text-muted"> Adventure Portal </small>
        </div>

        <router-link v-for="l in links" 
            :key="l.to"
            :to="l.to"
            :class="{active:route.path===l.to}"
            class="mb-2">
            <i :class="l.icon"></i>
            {{l.label}}
        </router-link>

        <hr>
        <a
            href="#"
            @click.prevent="doLogout"
            class="text-danger">
            <i class="bi bi-box-arrow-right"></i>
            Logout
        </a>
    </div>

    <div class="flex-grow-1">
        <nav class="navbar navbar-light bg-white shadow-sm px-4">
            <div>
                <h5 class="mb-0">
                    {{title}}
                </h5>
            </div>
            <div>
                <i class="bi bi-person-circle"></i>
                {{auth.user.full_name}}
            </div>
        </nav>
        <div class="p-4">
            <router-view></router-view>
        </div>
    </div>
</div>`,
};

// LOGIN PAGE

const Login = {
  setup() {
    const router = useRouter();
    const email = ref("");
    const password = ref("");
    const error = ref("");

    const submit = async () => {
      error.value = "";
      if (!email.value || !password.value) {
        error.value = "Please fill in all fields";
        return;
      }
      try {
        const data = await api("/api/login", "POST", {
          email: email.value,
          password: password.value,
        });
        auth.login(data.token, data.user);
        router.push("/" + data.user.role);
      } catch (e) {
        error.value = e.message;
      }
    };
    return { email, password, error, submit };
  },
  template: ` <div class="container-fluid vh-100">
    <div class="row h-100">
        <div class="col-lg-6 d-none d-lg-flex align-items-center justify-content-center">
            <div class="text-center px-5">
                <h1 class="fw-bold mt-4"> TREK IT </h1>
                <h4 class="text-muted">Explore. Book. Adventure.</h4>
                <p class="mt-4 text-secondary">Manage trekking routes, participants, staff members and bookings from one powerful dashboard.</p>
            </div>
        </div>

        <div class="col-lg-6 d-flex align-items-center justify-content-center">
            <div class="card p-5 shadow-lg" style="width:430px;">
                <h2 class="fw-bold text-center"> Welcome Back </h2>
                <p class="text-center text-muted"> Login to continue </p>
                <div v-if="error" class="alert alert-danger"> {{ error }} </div>
                <input v-model="email" type="email" class="form-control mb-3" placeholder="Email Address">
                <input v-model="password" type="password" class="form-control mb-4" placeholder="Password" @keyup.enter="submit">
                <button class="btn btn-primary w-100" @click="submit"> Login </button>
                <div class="text-center mt-4"> Don't have an account?
                    <router-link to="/register"> Create Account </router-link> 
                </div>
                <hr>
                <div class="text-center small text-muted"> Admin Login <br> 
                    admin@tma.com <br> 
                    Password : admin123
                </div>
            </div>
        </div>
    </div>
</div>`,
};

// REGISTER PAGE

const Register = {
  setup() {
    const router = useRouter();
    const form = reactive({
      full_name: "",
      email: "",
      password: "",
      confirm: "",
      contact: "",
    });
    const error = ref("");
    const success = ref("");

    const submit = async () => {
      error.value = "";
      success.value = "";
      if (!form.full_name || !form.email || !form.password) {
        error.value = "Please fill all required fields";
        return;
      }
      if (form.password !== form.confirm) {
        error.value = "Passwords do not match";
        return;
      }
      try {
        await api("/api/register", "POST", {
          full_name: form.full_name,
          email: form.email,
          password: form.password,
          contact: form.contact,
        });
        success.value = "Registration successful! Redirecting to login...";
        setTimeout(() => router.push("/login"), 1200);
      } catch (e) {
        error.value = e.message;
      }
    };
    return { form, error, success, submit };
  },
  template: ` <div class="container-fluid vh-100">
    <div class="row h-100">
        <div class="col-lg-6 d-none d-lg-flex align-items-center justify-content-center">
            <div class="text-center px-5">
                <h1 class="fw-bold mt-4"> Join the Adventure </h1>
                <h4 class="text-muted"> Create your Trekker Account </h4>
                <p class="mt-4 text-secondary"> Book exciting trekking adventures, track your bookings, and explore beautiful destinations.</p>
            </div>
        </div>
        <div class="col-lg-6 d-flex align-items-center justify-content-center">
            <div class="card p-5 shadow-lg" style="width:460px;">
                <h2 class="fw-bold text-center"> Create Account </h2>
                <p class="text-center text-muted mb-4"> Register as a Trekker </p>
                <div v-if="error" class="alert alert-danger"> {{ error }} </div>
                <div v-if="success" class="alert alert-success"> {{ success }} </div>
                <input v-model="form.full_name" class="form-control mb-3" placeholder="Full Name">
                <input v-model="form.email" type="email" class="form-control mb-3" placeholder="Email Address">
                <input v-model="form.password" type="password" class="form-control mb-3" placeholder="Password">
                <input v-model="form.confirm" type="password" class="form-control mb-3" placeholder="Confirm Password">
                <input v-model="form.contact" class="form-control mb-4" placeholder="Contact Number">
                <button class="btn btn-primary w-100" @click="submit"> Create Account </button>
                <div class="text-center mt-4"> Already have an account?
                <router-link to="/login"> Login </router-link>
                </div>
            </div>
        </div>
    </div>
</div>`,
};

// ADMIN COMPONENTS

// Admin Dashboard
const AdminDashboard = {
  setup() {
    const stats = ref({
      total_treks: 0,
      total_users: 0,
      total_staff: 0,
      total_bookings: 0,
      recent_bookings: [],
    });
    onMounted(async () => {
      stats.value = await api("/api/admin/dashboard");
    });
    return { stats };
  },
  template: `<div>
    <div class="card border-0 shadow-sm mb-4 overflow-hidden">
        <div class="card-body p-5">
            <div class="row align-items-center">
                <div class="col-lg-8">
                    <h2 class="fw-bold mb-2"> Welcome Administrator </h2>
                    <p class="text-muted mb-0"> Manage trekking operations, staff members, users and bookings from one central dashboard.</p>
                </div>
            </div>
        </div>
    </div>

    <div class="row g-4 mb-4">
        <div class="col-md-3">
            <div class="card h-100">
                <div class="card-body">
                    <div class="d-flex justify-content-between">
                        <div>
                            <small class="text-muted"> Total Treks </small>
                            <h2 class="fw-bold"> {{stats.total_treks}} </h2>
                        </div>
                        <i class="bi bi-map-fill text-success fs-1"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card h-100">
                <div class="card-body">
                    <div class="d-flex justify-content-between">
                        <div>
                            <small class="text-muted"> Users </small>
                            <h2 class="fw-bold"> {{stats.total_users}} </h2>
                        </div>
                        <i class="bi bi-people-fill text-primary fs-1"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card h-100">
                <div class="card-body">
                    <div class="d-flex justify-content-between">
                        <div>
                            <small class="text-muted"> Staff </small>
                            <h2 class="fw-bold"> {{stats.total_staff}} </h2>
                        </div>
                        <i class="bi bi-person-workspace text-warning fs-1"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card h-100">
                <div class="card-body">
                    <div class="d-flex justify-content-between">
                        <div>
                            <small class="text-muted"> Bookings </small>
                            <h2 class="fw-bold"> {{stats.total_bookings}} </h2>
                        </div>
                        <i class="bi bi-calendar-check-fill text-danger fs-1"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="card shadow-sm mb-4">
        <div class="card-body">
            <h5 class="fw-bold mb-3"> Quick Actions </h5>
            <div class="d-flex flex-wrap gap-3">
                <router-link
                    to="/admin/treks"
                    class="btn btn-success">
                    <i class="bi bi-plus-circle"></i> Add Trek
                </router-link>

                <router-link
                    to="/admin/staff"
                    class="btn btn-primary">
                    <i class="bi bi-person-plus"></i> Add Staff
                </router-link>

                <router-link
                    to="/admin/bookings"
                    class="btn btn-outline-dark">
                    <i class="bi bi-card-list"></i> View Bookings
                </router-link>
            </div>
        </div>
    </div>

    <div class="card shadow-sm">
        <div class="card-body">
            <h5 class="fw-bold mb-3"> Recent Bookings </h5>
            <table class="table align-middle">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>User</th>
                        <th>Trek</th>
                        <th>Date</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                    v-for="b in stats.recent_bookings"
                    :key="b.id">
                        <td>B{{b.id}}</td>
                        <td>{{b.user_name}}</td>
                        <td>{{b.trek_name}}</td>
                        <td>{{b.booking_date}}</td>
                        <td>
                            <span class="badge bg-success">
                            {{b.status}}
                            </span>
                        </td>
                    </tr>
                    <tr v-if="!stats.recent_bookings.length">
                        <td colspan="5" class="text-center text-muted">
                            No recent bookings
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>`,
};

// Admin Manage Treks
const AdminTreks = {
  setup() {
    const treks = ref([]);
    const staff = ref([]);
    const search = ref("");
    const showForm = ref(false);
    const trekModal = ref(null);
    let modal = null;
    const editing = ref(null);
    const error = ref("");
    const blank = () => ({
      name: "",
      location: "",
      difficulty: "Easy",
      duration: 1,
      total_slots: 10,
      status: "Pending",
      start_date: "",
      end_date: "",
      description: "",
      assigned_staff_id: "",
    });
    const form = reactive(blank());
    const load = async () => {
      treks.value = await api(
        "/api/admin/treks" + (search.value ? "?search=" + search.value : ""),
      );
    };
    const loadStaff = async () => {
      staff.value = await api("/api/admin/staff");
    };
    onMounted(async () => {
      await load();
      await loadStaff();
      modal = new bootstrap.Modal(trekModal.value);
    });
    const openAdd = () => {
      editing.value = null;
      Object.assign(form, blank());
      error.value = "";
      modal.show();
    };
    const openEdit = (t) => {
      editing.value = t.id;
      Object.assign(form, t);
      error.value = "";
      modal.show();
    };
    const closeModal = () => {
      modal.hide();
    };
    const save = async () => {
      error.value = "";
      if (!form.name || !form.location) {
        error.value = "Name and location are required";
        return;
      }
      try {
        if (editing.value)
          await api("/api/admin/treks/" + editing.value, "PUT", form);
        else await api("/api/admin/treks", "POST", form);
        modal.hide();
        await load();
      } catch (e) {
        error.value = e.message;
      }
    };
    const remove = async (id) => {
      if (!confirm("Delete this trek?")) return;
      await api("/api/admin/treks/" + id, "DELETE");
      await load();
    };
    return {
      treks,
      staff,
      search,
      editing,
      form,
      error,
      trekModal,
      load,
      openAdd,
      openEdit,
      closeModal,
      save,
      remove,
    };
  },
  template: `
<div class="card shadow-sm border-0 mb-4">
    <div class="card-body">
        <div class="row align-items-center">
            <div class="col-md-8">
                <h2 class="fw-bold mb-1"> Trek Management </h2>
                <p class="text-muted mb-0"> Create, edit and manage trekking events from one place. </p>
            </div>
            <div class="col-md-4 text-end">
                <button class="btn btn-success btn-lg" @click="openAdd">
                    <i class="bi bi-plus-circle"></i>
                    Add Trek
                </button>
            </div>
        </div>
    </div>
</div>
<div class="row mb-4">
    <div class="col-md-5">
        <div class="input-group shadow-sm">
            <span class="input-group-text bg-white border-end-0">
                <i class="bi bi-search text-success"></i>
            </span>
            <input v-model="search" class="form-control border-start-0" placeholder="Search trek by name or location" @keyup.enter="load">
        </div>
    </div>
</div>

<div class="modal fade" id="trekModal" tabindex="-1" ref="trekModal">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header border-0 pb-0">
                <div>
                    <h3 class="fw-bold mb-1"> {{ editing ? 'Edit Trek' : 'Add New Trek' }} </h3>
                    <p class="text-muted mb-0"> Create or update a trekking event. </p>
                </div>
                <button type="button" class="btn-close" @click="closeModal"> </button>
            </div>
            <div class="modal-body">
                <div v-if="error" class="alert alert-danger"> {{ error }} </div>
                <div class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label"> Trek Name </label>
                        <input v-model="form.name" class="form-control">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label"> Location </label>
                        <input v-model="form.location" class="form-control">
                    </div>
                    <div class="col-md-4">
                        <label class="form-label fw-semibold">Difficulty</label>
                        <select v-model="form.difficulty" class="form-select">
                            <option>Easy</option>
                            <option>Moderate</option>
                            <option>Hard</option>
                        </select>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label fw-semibold">Duration</label>
                        <input type="number" v-model.number="form.duration" class="form-control">
                    </div>

                    <div class="col-md-4">
                        <label class="form-label fw-semibold">Total Slots</label>
                        <input type="number" v-model.number="form.total_slots" class="form-control">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label fw-semibold">Start Date</label> 
                        <input type="date" v-model="form.start_date" class="form-control">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label fw-semibold">End Date</label>
                        <input type="date" v-model="form.end_date" class="form-control"> 
                    </div>
                    <div class="col-md-6">
                        <label class="form-label fw-semibold">Assign Staff</label>
                        <select v-model="form.assigned_staff_id" class="form-select">
                            <option value=""> Select Staff </option>
                            <option v-for="s in staff" :key="s.id" :value="s.id"> {{s.full_name}} </option>
                        </select>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label fw-semibold">Status</label>
                        <select v-model="form.status" class="form-select">
                            <option>Pending</option>
                            <option>Approved</option>
                            <option>Open</option>
                            <option>Closed</option>
                            <option>Completed</option>
                        </select>
                    </div>
                    <div class="col-12">
                        <label class="form-label fw-semibold">Description</label>
                        <textarea rows="3" v-model="form.description" class="form-control"> </textarea>
                    </div>
                </div>
            </div>
            <div class="modal-footer border-0">
                <button class="btn btn-secondary" @click="closeModal"> Cancel </button>
                <button class="btn btn-success px-4" @click="save"> {{ editing ? 'Update Trek' : 'Save Trek' }} </button>
            </div>
        </div>
    </div>
</div>

<div class="card shadow-sm border-0">
    <div class="card-body">
        <div class="table-responsive">
            <table class="table table-hover align-middle">
            <thead class="table-light">
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Location</th>
                    <th>Difficulty</th>
                    <th>Slots</th>
                    <th>Status</th>
                    <th>Staff</th>
                    <th width="150">Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="t in treks" :key="t.id">
                    <td>#{{t.id}}</td>
                    <td class="fw-semibold"> {{t.name}} </td>
                    <td> <i class="bi bi-geo-alt text-success"></i> {{t.location}} </td>
                    <td> 
                        <span class="badge" :class="{ 'bg-success':t.difficulty=='Easy', 'bg-warning text-dark':t.difficulty=='Moderate', 'bg-danger':t.difficulty=='Hard'}">
                            {{t.difficulty}}
                        </span>
                    </td>
                    <td> {{t.available_slots}} / {{t.total_slots}} </td>
                    <td> 
                        <span class="badge" :class="{ 'bg-success':t.status=='Open','bg-warning text-dark':t.status=='Pending', 'bg-danger':t.status=='Closed', 'bg-primary':t.status=='Completed', 'bg-secondary':t.status=='Approved' }">
                            {{t.status}}
                        </span>
                    </td>
                    <td> {{t.assigned_staff_name || 'Not Assigned'}} </td>
                    <td> 
                        <button class="btn btn-sm btn-outline-primary me-2" @click="openEdit(t)"> <i class="bi bi-pencil"></i> </button>
                        <button class="btn btn-sm btn-outline-danger" @click="remove(t.id)"> <i class="bi bi-trash"></i> </button>
                    </td>
                </tr>
                <tr v-if="treks.length==0">
                    <td colspan="8" class="text-center py-5">
                        <i class="bi bi-map display-3 text-success"> </i>
                        <h5 class="mt-3"> No Treks Available </h5>
                        <p class="text-muted"> Click the green button above to create your first trek. </p>
                    </td>
                </tr>
            </tbody>
            </table>
        </div>
    </div>
</div>`,
};

// Admin Manage Staff

const AdminStaff = {
  setup() {
    const staff = ref([]);
    const search = ref("");
    const error = ref("");

    const staffModal = ref(null);
    let modal = null;
    const form = reactive({
      full_name: "",
      email: "",
      password: "",
      contact: "",
    });
    const load = async () => {
      staff.value = await api(
        "/api/admin/staff" +
          (search.value ? "?search=" + encodeURIComponent(search.value) : ""),
      );
    };
    onMounted(async () => {
      await load();
      modal = new bootstrap.Modal(staffModal.value);
    });
    const openAdd = () => {
      error.value = "";
      Object.assign(form, {
        full_name: "",
        email: "",
        password: "",
        contact: "",
      });
      modal.show();
    };
    const closeModal = () => {
      modal.hide();
    };
    const add = async () => {
      error.value = "";
      if (!form.full_name || !form.email || !form.password) {
        error.value = "Please fill all required fields";
        return;
      }
      try {
        await api("/api/admin/staff", "POST", form);
        modal.hide();
        await load();
      } catch (e) {
        error.value = e.message;
      }
    };
    const toggle = async (s) => {
      if (
        !confirm(
          s.active
            ? "Blacklist this staff member?"
            : "Activate this staff member?",
        )
      )
        return;
      await api("/api/admin/staff/" + s.id + "/toggle", "PUT");
      await load();
    };
    return {
      staff,
      search,
      form,
      error,
      staffModal,
      openAdd,
      closeModal,
      add,
      toggle,
      load,
    };
  },
  template: `
<div>
    <div class="card shadow-sm border-0 mb-4">
        <div class="card-body">
            <div class="row align-items-center">
                <div class="col-md-8">
                    <h2 class="fw-bold mb-1"> Staff Management </h2>
                    <p class="text-muted mb-0"> Add, manage and activate trekking staff members. </p>
                </div>
                <div class="col-md-4 text-end">
                    <button class="btn btn-success btn-lg" @click="openAdd">
                        <i class="bi bi-person-plus"></i> Add Staff
                    </button>
                </div>
            </div>
        </div>
    </div>

    <div class="row mb-4">
        <div class="col-md-5">
            <div class="input-group shadow-sm">
                <span class="input-group-text bg-white border-end-0">
                    <i class="bi bi-search text-success"></i>
                </span>
                <input v-model="search" class="form-control border-start-0" placeholder="Search by name or email" @input="load">
            </div>
        </div>
    </div>

<div class="modal fade" ref="staffModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <div>
                    <h3 class="fw-bold"> Add Staff </h3>
                    <p class="text-muted mb-0"> Create a new trekking staff member. </p>
                </div>
                <button type="button" class="btn-close" @click="closeModal"> </button>
            </div>
            <div class="modal-body"> 
                <div v-if="error" class="alert alert-danger"> {{error}} </div>
                <div class="row g-3">
                    <div class="col-md-6">
                        <label>Full Name</label>
                        <input v-model="form.full_name" class="form-control"> 
                    </div>
                    <div class="col-md-6">
                        <label>Email</label>
                        <input v-model="form.email" type="email" class="form-control">
                    </div>
                    <div class="col-md-6">
                        <label>Password</label>
                        <input v-model="form.password" type="password" class="form-control">
                    </div>
                    <div class="col-md-6">
                        <label>Phone</label>
                        <input v-model="form.contact" class="form-control">
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" @click="closeModal"> Cancel </button>
                <button class="btn btn-success" @click="add"> Save Staff </button>
            </div>
        </div>
    </div>
</div>

<div class="card shadow-sm border-0">
    <div class="card-body">
        <div class="table-responsive">
            <table class="table table-hover align-middle">
                <thead class="table-light">
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Status</th>
                        <th>Treks Assigned</th>
                        <th width="150"> Actions </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="s in staff" :key="s.id">
                        <td> #{{s.id}} </td>
                        <td class="fw-semibold"> {{s.full_name}} </td>
                        <td> {{s.email}} </td>
                        <td> {{s.contact || '-'}} </td>
                        <td>
                            <span class="badge" :class="s.active ? 'bg-success' : 'bg-danger'">
                                {{ s.active ? 'Active' : 'Blacklisted' }}
                            </span>
                        </td>
                        <td> {{ s.trek_count || 0 }} </td>
                        <td>
                            <button v-if="s.active" class="btn btn-sm btn-outline-danger" @click="toggle(s)">
                                <i class="bi bi-slash-circle"></i>
                            </button>
                            <button v-else class="btn btn-sm btn-outline-success" @click="toggle(s)">
                                <i class="bi bi-check-circle"></i>
                            </button>
                        </td>
                    </tr>
                    <tr v-if="staff.length==0">
                        <td colspan="7" class="text-center py-5">
                            <i class="bi bi-person-workspace display-3 text-success"> </i>
                            <h5 class="mt-3"> No Staff Added </h5>
                                <p class="text-muted"> Click the green button above to create your first staff member. </p>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>
</div>`,
};

// Admin Manage Users
const AdminUsers = {
  setup() {
    const users = ref([]);
    const search = ref("");
    const load = async () => {
      users.value = await api(
        "/api/admin/users" + (search.value ? "?search=" + search.value : ""),
      );
    };
    onMounted(load);
    const toggle = async (u) => {
      await api("/api/admin/users/" + u.id + "/toggle", "PUT");
      await load();
    };
    return { users, search, load, toggle };
  },
  template: `
<div class="d-flex justify-content-between align-items-center mb-4">
    <div class="card shadow-sm border-0 flex-grow-1 me-3">
        <div class="card-body py-4">
            <h1 class="fw-bold mb-1"> Manage Users </h1>
            <p class="text-muted mb-0"> View, search and manage registered trekkers.</p>
        </div>
    </div>
</div>

<div class="input-group mb-4 shadow-sm" style="max-width:600px;">
    <span class="input-group-text bg-white border-end-0">
        <i class="bi bi-search text-success"></i>
    </span>
    <input v-model="search" class="form-control border-start-0" placeholder="Search user by name or email" @keyup.enter="load">
</div>

<div class="card shadow-sm border-0">
    <div class="card-body">
        <div class="table-responsive">
            <table class="table table-hover align-middle">
                <thead class="table-light">
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th width="170">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="u in users" :key="u.id">
                        <td> #{{u.id}} </td>
                        <td class="fw-semibold"> {{u.full_name}} </td>
                        <td> {{u.email}} </td>
                        <td> <span class="badge" :class="u.active ? 'bg-success' : 'bg-danger'"> {{u.active ? 'Active' : 'Blacklisted'}} </span> </td>
                        <td>
                            <button v-if="u.active" class="btn btn-sm btn-outline-danger" @click="toggle(u)"> <i class="bi bi-person-x"></i> </button>
                            <button v-else class="btn btn-sm btn-outline-success" @click="toggle(u)"> <i class="bi bi-person-check"></i> </button>
                        </td>
                    </tr>
                    <tr v-if="users.length==0">
                        <td colspan="5" class="text-center py-5">
                            <i class="bi bi-people display-3 text-success"></i>
                            <h5 class="mt-3"> No Users Found </h5>
                            <p class="text-muted"> No trekkers have registered yet. </p>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>`,
};

// Admin Bookings

const AdminBookings = {
  setup() {
    const bookings = ref([]);
    const search = ref("");
    const load = async () => {
      bookings.value = await api(
        "/api/admin/bookings" +
          (search.value ? "?search=" + encodeURIComponent(search.value) : ""),
      );
    };
    onMounted(load);
    return { bookings, search, load };
  },
  template: `
<div class="d-flex justify-content-between align-items-center mb-4">
    <div class="card shadow-sm border-0 flex-grow-1">
        <div class="card-body py-4">
            <h1 class="fw-bold mb-1"> Booking Management </h1>
            <p class="text-muted mb-0"> View and monitor all trekking bookings. </p>
        </div>
    </div>
</div>

<div class="input-group mb-4 shadow-sm" style="max-width:600px;">
    <span class="input-group-text bg-white border-end-0">
        <i class="bi bi-search text-success"></i>
    </span>
    <input v-model="search" class="form-control border-start-0" placeholder="Search booking by user or trek" @input="load">
</div>

<div class="card shadow-sm border-0">
    <div class="card-body">
        <div class="table-responsive">
            <table class="table table-hover align-middle">
                <thead class="table-light">
                    <tr>
                        <th>ID</th>
                        <th>User</th>
                        <th>Trek</th>
                        <th>Location</th>
                        <th>Date</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="b in bookings" :key="b.id">
                        <td>#{{b.id}}</td>
                        <td class="fw-semibold"> {{b.user_name}} </td>
                        <td> {{b.trek_name}} </td>
                        <td> <i class="bi bi-geo-alt text-success"></i> {{b.location}} </td>
                        <td> {{b.booking_date}} </td>
                        <td> <span class="badge" :class="{
                            'bg-success': b.status=='Booked',
                            'bg-danger': b.status=='Cancelled',
                            'bg-warning text-dark': b.status=='Pending',
                            'bg-primary': b.status=='Completed' }">
                            {{b.status}} </span>
                        </td>
                    </tr>
                    <tr v-if="bookings.length==0">
                        <td colspan="6" class="text-center py-5">
                            <i class="bi bi-calendar-check display-3 text-success"></i>
                            <h5 class="mt-3"> No Bookings Found </h5>
                            <p class="text-muted"> Bookings will appear here once trekkers reserve a trek. </p>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>`,
};

// STAFF COMPONENTS

// Staff Dashboard

const StaffDashboard = {
  setup() {
    const d = ref({
      assigned_treks: 0,
      total_participants: 0,
      open_treks: 0,
      treks: [],
    });
    onMounted(async () => {
      d.value = await api("/api/staff/dashboard");
    });
    return { d };
  },
  template: `
<div class="card shadow-sm border-0 mb-4">
    <div class="card-body py-4">
        <div class="d-flex justify-content-between align-items-center">
            <div>
                <h1 class="fw-bold mb-1"> Staff Dashboard </h1>
                <p class="text-muted mb-0"> View your assigned treks and manage participants. </p>
            </div>
        </div>
    </div>
</div>

<div class="row g-4 mb-4">
    <div class="col-md-4">
        <div class="card shadow-sm border-0">
            <div class="card-body">
                <div class="text-muted">
                    Assigned Treks 
                </div>
                <h2 class="fw-bold"> {{d.assigned_treks}} </h2>
            </div>
        </div>
    </div>
    <div class="col-md-4">
        <div class="card shadow-sm border-0">
            <div class="card-body">
                <div class="text-muted">
                    Participants
                </div>
                <h2 class="fw-bold"> {{d.total_participants}} </h2>
            </div>
        </div>
    </div>
    <div class="col-md-4">
        <div class="card shadow-sm border-0">
            <div class="card-body">
                <div class="text-muted"> Open Treks </div>
                <h2 class="fw-bold"> {{d.open_treks}} </h2>
            </div>
        </div>
    </div>
</div>

<div class="card shadow-sm border-0">
    <div class="card-body">
        <h4 class="fw-bold mb-4"> My Assigned Treks </h4>
        <div class="table-responsive">
            <table class="table table-hover align-middle">
                <thead class="table-light">
                    <tr>
                        <th>Trek</th>
                        <th>Location</th>
                        <th>Participants</th>
                        <th>Slots</th>
                        <th>Status</th>
                        <th width="150"> Action </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="t in d.treks" :key="t.id">
                        <td class="fw-semibold"> {{t.name}} </td>
                        <td> <i class="bi bi-geo-alt text-success"></i> {{t.location}} </td>
                        <td> {{t.total_slots-t.available_slots}} </td>
                        <td> {{t.available_slots}} / {{t.total_slots}} </td>
                        <td> <span class="badge" :class="{
                            'bg-success':t.status=='Open',
                            'bg-warning text-dark':t.status=='Pending',
                            'bg-danger':t.status=='Closed',
                            'bg-primary':t.status=='Completed' }">
                                {{t.status}}
                            </span> </td>
                        <td> <router-link :to="'/staff/trek/'+t.id" class="btn btn-outline-primary btn-sm">
                            <i class="bi bi-pencil-square"></i> Manage </router-link>
                        </td>
                    </tr>
                    <tr v-if="d.treks.length==0">
                        <td colspan="6" class="text-center py-5">
                            <i class="bi bi-map display-3 text-success"></i>
                            <h5 class="mt-3"> No Assigned Treks </h5>
                            <p class="text-muted"> Treks assigned by the administrator will appear here.</p>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>`,
};

// Staff Manage Trek
const StaffManageTrek = {
  setup() {
    const route = useRoute();
    const trekId = route.params.id;
    const trek = ref(null);
    const participants = ref([]);
    const msg = ref("");
    const load = async () => {
      const all = await api("/api/staff/treks");
      trek.value = all.find((t) => t.id == trekId);
      participants.value = await api(
        "/api/staff/treks/" + trekId + "/participants",
      );
    };
    onMounted(load);
    const saveSlots = async () => {
      msg.value = "";
      try {
        await api("/api/staff/treks/" + trekId, "PUT", {
          available_slots: trek.value.available_slots,
          status: trek.value.status,
        });
        msg.value = "Saved!";
        await load();
      } catch (e) {
        msg.value = e.message;
      }
    };
    const mark = async (status) => {
      await api("/api/staff/treks/" + trekId + "/mark", "PUT", { status });
      await load();
    };
    return { trek, participants, msg, saveSlots, mark };
  },
  template: `
<router-link to="/staff" class="btn btn-link mb-3">
    <i class="bi bi-arrow-left"></i> Back to Dashboard
</router-link>

<div v-if="trek">
    <div class="card shadow-sm border-0 mb-4">
        <div class="card-body">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h2 class="fw-bold mb-1"> {{trek.name}} </h2>
                    <p class="text-muted mb-0"> Manage trek information and participants. </p>
                </div>
                <span class="badge fs-6" :class="{
                    'bg-success':trek.status=='Open',
                    'bg-warning text-dark':trek.status=='Pending',
                    'bg-danger':trek.status=='Closed',
                    'bg-primary':trek.status=='Completed' }">
                    {{trek.status}}
                </span>
            </div>
        </div>
    </div>
    <div v-if="msg" class="alert alert-success"> {{msg}} </div>
    <div class="row">
        <div class="col-lg-5">
            <div class="card shadow-sm border-0 mb-4">
                <div class="card-body">
                    <h5 class="fw-bold mb-3"> Trek Details </h5>
                    <p><strong>Location:</strong> {{trek.location}}</p>
                    <p><strong>Difficulty:</strong> {{trek.difficulty}}</p>
                    <p><strong>Duration:</strong> {{trek.duration}} Days</p>
                    <p><strong>Total Slots:</strong> {{trek.total_slots}}</p>
                    <hr> <label class="form-label"> Available Slots </label>
                    <input type="number" class="form-control mb-3" v-model.number="trek.available_slots">
                    <label class="form-label"> Status </label>
                    <select v-model="trek.status" class="form-select mb-3">
                        <option>Pending</option>
                        <option>Open</option>
                        <option>Closed</option>
                        <option>Completed</option>
                    </select>
                    <button class="btn btn-success w-100" @click="saveSlots">
                    <i class="bi bi-check-circle"></i> Save Changes </button>
                </div>
            </div>
            <div class="card shadow-sm border-0">
                <div class="card-body">
                    <h5 class="fw-bold mb-3"> Quick Actions </h5>
                    <div class="d-grid gap-2">
                        <button class="btn btn-outline-success" @click="mark('Open')">
                            <i class="bi bi-play-circle"></i> Start Trek
                        </button>
                        <button class="btn btn-outline-primary" @click="mark('Completed')">
                            <i class="bi bi-flag"></i> Complete Trek
                        </button>
                    </div>
                </div>
            </div>
        </div>

<div class="col-lg-7">
    <div class="card shadow-sm border-0">
        <div class="card-body">
            <h5 class="fw-bold mb-3"> Participants ({{participants.length}}) </h5>
            <div class="table-responsive">
                <table class="table table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>Name</th>
                            <th>Booking Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="p in participants" :key="p.id">
                            <td class="fw-semibold"> {{p.user_name}} </td>
                            <td> {{p.booking_date}} </td>
                            <td> <span class="badge bg-success"> {{p.status}} </span> </td>
                        </tr>
                        <tr v-if="participants.length==0">
                            <td colspan="3" class="text-center py-5">
                                <i class="bi bi-people display-3 text-success"></i>
                                <h5 class="mt-3"> No Participants Yet </h5>
                                <p class="text-muted"> Participants will appear after bookings are approved. </p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

</div>
</div>
</div>`,
};

// USER (TREKKER) COMPONENTS

// User Dashboard

const UserDashboard = {
  setup() {
    const treks = ref([]);
    const bookings = ref([]);
    const load = async () => {
      treks.value = await api("/api/treks");
      bookings.value = await api("/api/my-bookings");
    };
    onMounted(load);
    const book = async (id) => {
      try {
        await api("/api/treks/" + id + "/book", "POST");
        await load();
      } catch (e) {
        alert(e.message);
      }
    };
    return { auth, treks, bookings, book };
  },
  template: `
<div class="card shadow-sm border-0 mb-4">
    <div class="card-body">
        <div class="d-flex justify-content-between align-items-center">
            <div>
                <h1 class="fw-bold mb-1"> Welcome, {{auth.user.full_name}} </h1>
                <p class="text-muted mb-0"> Discover amazing trekking adventures and manage your bookings. </p>
            </div>
        </div>
    </div>
</div>

<div class="card shadow-sm border-0 mb-4">
    <div class="card-body">
        <h4 class="fw-bold mb-4"> Available Treks </h4>
        <div class="table-responsive">
            <table class="table table-hover align-middle">
                <thead class="table-light">
                    <tr>
                        <th>Name</th>
                        <th>Location</th>
                        <th>Difficulty</th>
                        <th>Duration</th>
                        <th>Slots</th>
                        <th width="150"> Action </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="t in treks" :key="t.id">
                        <td class="fw-semibold"> {{t.name}} </td>
                        <td> <i class="bi bi-geo-alt text-success"></i> {{t.location}} </td>
                        <td> <span class="badge" :class="{ 
                            'bg-success':t.difficulty=='Easy',
                            'bg-warning text-dark':t.difficulty=='Moderate',
                            'bg-danger':t.difficulty=='Hard' }">
                                {{t.difficulty}} </span> </td>
                        <td> {{t.duration}} Days </td>
                        <td> {{t.available_slots}} </td>
                        <td> <button class="btn btn-success btn-sm" @click="book(t.id)" :disabled="t.available_slots<=0">
                            <i class="bi bi-calendar-plus"></i> Book </button>
                        </td>
                    </tr>
                    <tr v-if="treks.length==0">
                        <td colspan="6" class="text-center py-5">
                            <i class="bi bi-map display-3 text-success"></i>
                            <h5 class="mt-3"> No Treks Available </h5>
                            <p class="text-muted"> Please check again later. </p>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>

<div class="card shadow-sm border-0">
    <div class="card-body">
        <h4 class="fw-bold mb-4"> My Bookings </h4>
        <div class="table-responsive">
            <table class="table table-hover align-middle">
                <thead class="table-light">
                    <tr>
                        <th>Trek</th>
                        <th>Date</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="b in bookings" :key="b.id">
                        <td class="fw-semibold"> {{b.trek_name}} </td>
                        <td> {{b.booking_date}} </td>
                        <td> <span class="badge" :class="{
                            'bg-success':b.status=='Booked',
                            'bg-danger':b.status=='Cancelled',
                            'bg-warning text-dark':b.status=='Pending',
                            'bg-primary':b.status=='Completed' }">
                                {{b.status}}
                            </span>
                        </td>
                    </tr>
                    <tr v-if="bookings.length==0">
                        <td colspan="3" class="text-center py-5">
                            <i class="bi bi-calendar-x display-3 text-success"></i>
                            <h5 class="mt-3"> No Bookings Yet </h5>
                            <p class="text-muted"> Book your first trek to start your adventure. </p>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>`,
};

// User Browse Treks

const UserBrowse = {
  setup() {
    const treks = ref([]);
    const search = ref("");
    const difficulty = ref("");
    const location = ref("");
    const load = async () => {
      let q = [];
      if (search.value) q.push("search=" + search.value);
      if (difficulty.value) q.push("difficulty=" + difficulty.value);
      if (location.value) q.push("location=" + location.value);
      treks.value = await api(
        "/api/treks" + (q.length ? "?" + q.join("&") : ""),
      );
    };
    onMounted(load);
    const book = async (id) => {
      try {
        await api("/api/treks/" + id + "/book", "POST");
        alert("Booked!");
        await load();
      } catch (e) {
        alert(e.message);
      }
    };
    return { treks, search, difficulty, location, load, book };
  },
  template: `
<div class="card shadow-sm border-0 mb-4">
    <div class="card-body d-flex justify-content-between align-items-center">
        <div>
            <h1 class="fw-bold mb-1"> Browse Treks </h1>
            <p class="text-muted mb-0"> Find your next trekking adventure. </p>
        </div>
    </div>
</div>

<div class="card shadow-sm border-0 mb-4">
    <div class="card-body">
        <div class="row g-3">
            <div class="col-md-5">
                <div class="input-group">
                    <input v-model="search" class="form-control" placeholder="Search trek" @keyup.enter="load">
                </div>
            </div>
            <div class="col-md-3">
                <select v-model="difficulty" class="form-select" @change="load">
                    <option value="">All Difficulty</option>
                    <option>Easy</option>
                    <option>Moderate</option>
                    <option>Hard</option>
                </select>
            </div>
            <div class="col-md-3">
                <input v-model="location" class="form-control" placeholder="Location" @keyup.enter="load">
            </div>
            <div class="col-md-1">
                <button class="btn btn-success w-100" @click="load">
                    <i class="bi bi-search"></i>
                </button>
            </div>
        </div>
    </div>
</div>

<div class="row g-4">
    <div class="col-lg-4 col-md-6" v-for="t in treks" :key="t.id">
        <div class="card shadow-sm border-0 h-100">
            <div class="card-body">
                <div class="d-flex justify-content-between">
                    <h5 class="fw-bold"> {{t.name}} </h5>
                    <span class="badge" :class="{
                        'bg-success':t.difficulty=='Easy',
                        'bg-warning text-dark':t.difficulty=='Moderate',
                        'bg-danger':t.difficulty=='Hard'}"> 
                            {{t.difficulty}}
                    </span>
                </div>
                <hr> <p class="mb-2"> <i class="bi bi-geo-alt text-success"></i> {{t.location}} </p>
                <p class="mb-2"> <i class="bi bi-calendar-event text-success"></i> {{t.duration}} Days </p> 
                <p class="mb-3"> <i class="bi bi-people text-success"></i> {{t.available_slots}} Slots Available </p>
                <button class="btn btn-success w-100" @click="book(t.id)" :disabled="t.available_slots<=0">
                    <i class="bi bi-calendar-plus"></i> Book Trek
                </button>
            </div>
        </div>
    </div>

    <div v-if="!treks.length" class="col-12">
        <div class="card shadow-sm border-0">
            <div class="card-body text-center py-5">
                <i class="bi bi-map display-3 text-success"></i>
                <h4 class="mt-3"> No Treks Found </h4>
                <p class="text-muted"> Try changing your search or filters. </p>
            </div>
        </div>
    </div>
</div>`,
};

// User History
const UserHistory = {
  setup() {
    const bookings = ref([]);
    const load = async () => {
      bookings.value = await api("/api/my-bookings");
    };
    onMounted(load);
    const cancel = async (id) => {
      if (!confirm("Cancel this booking?")) return;
      try {
        await api("/api/bookings/" + id + "/cancel", "PUT");
        await load();
      } catch (e) {
        alert(e.message);
      }
    };
    const exportCsv = async () => {
      try {
        const data = await api("/api/export-history");
        alert(data.message);
      } catch (e) {
        alert(e.message);
      }
    };
    return { bookings, cancel, exportCsv };
  },
  template: `
<div class="card shadow-sm border-0 mb-4">
    <div class="card-body d-flex justify-content-between align-items-center">
        <div>
            <h1 class="fw-bold mb-1"> Trekking History </h1>
            <p class="text-muted mb-0"> View all your bookings and export them anytime. </p>
        </div>
        <button class="btn btn-success" @click="exportCsv">
            <i class="bi bi-download"></i>
            Export CSV
        </button>
    </div>
</div>

<div class="card shadow-sm border-0">
    <div class="card-body">
        <div class="table-responsive">
            <table class="table table-hover align-middle">
                <thead class="table-light">
                    <tr>
                        <th>Trek</th>
                        <th>Location</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th width="170">Action</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="b in bookings" :key="b.id">
                        <td class="fw-semibold"> {{ b.trek_name }} </td>
                        <td> <i class="bi bi-geo-alt text-success"></i> {{ b.location }} </td>
                        <td> {{ b.booking_date }} </td>
                        <td> <span class="badge" :class="{ 
                            'bg-success': b.status=='Booked',
                            'bg-danger': b.status=='Cancelled',
                            'bg-secondary': b.status!='Booked' && b.status!='Cancelled'}">
                                {{ b.status }}
                            </span>
                        </td>
                        <td> <button v-if="b.status=='Booked'" class="btn btn-sm btn-outline-danger" @click="cancel(b.id)">
                            <i class="bi bi-x-circle"></i>
                                Cancel
                            </button>
                            <span v-else class="text-muted"> — </span>
                        </td>
                    </tr>
                    <tr v-if="!bookings.length">
                        <td colspan="5" class="text-center py-5">
                            <i class="bi bi-clock-history display-3 text-success"></i>
                            <h4 class="mt-3"> No Booking History </h4>
                            <p class="text-muted"> Your completed and cancelled bookings will appear here. </p>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>`,
};

// User Profile

const UserProfile = {
  setup() {
    const form = reactive({
      full_name: auth.user.full_name,
      contact: auth.user.contact || "",
      password: "",
    });
    const msg = ref("");
    const save = async () => {
      try {
        const data = await api("/api/profile", "PUT", form);
        auth.user = data.user;
        localStorage.setItem("user", JSON.stringify(data.user));
        msg.value = "Profile updated!";
      } catch (e) {
        msg.value = e.message;
      }
    };
    return { form, msg, save };
  },
  template: `
<div class="card shadow-sm border-0 mb-4">
    <div class="card-body d-flex justify-content-between align-items-center">
        <div>
            <h1 class="fw-bold mb-1"> My Profile </h1>
            <p class="text-muted mb-0"> Update your personal information and password. </p>
        </div>
        <i class="bi bi-person-circle text-success" style="font-size:60px"></i>
    </div>
</div>

<div class="row justify-content-center">
    <div class="col-lg-7">
        <div class="card shadow-sm border-0">
            <div class="card-body p-4">
                <div v-if="msg" class="alert alert-success"> {{ msg }} </div>
                <div class="mb-3">
                    <label class="form-label fw-semibold"> Full Name </label>
                    <input v-model="form.full_name" class="form-control" placeholder="Enter your full name">
                </div>
                <div class="mb-3">
                    <label class="form-label fw-semibold"> Contact Number </label>
                    <input v-model="form.contact" class="form-control" placeholder="Enter contact number">
                </div>
                <div class="mb-4">
                    <label class="form-label fw-semibold"> New Password </label>
                    <input v-model="form.password" type="password" class="form-control" placeholder="Leave blank to keep current password">
                    <div class="form-text">
                        Password will remain unchanged if left empty.
                    </div>
                </div>
                <div class="text-end">
                    <button class="btn btn-success px-4" @click="save">
                        <i class="bi bi-check-circle"></i> Save Changes
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>`,
};

// ROUTER

// Sidebar menus for each role.
const adminLinks = [
  { to: "/admin", label: "Dashboard", icon: "bi bi-speedometer2" },
  { to: "/admin/treks", label: "Treks", icon: "bi bi-map" },
  { to: "/admin/staff", label: "Staff", icon: "bi bi-people" },
  { to: "/admin/users", label: "Users", icon: "bi bi-person" },
  { to: "/admin/bookings", label: "Bookings", icon: "bi bi-journal-check" },
];
const staffLinks = [
  { to: "/staff", label: "Dashboard", icon: "bi bi-speedometer2" },
];
const userLinks = [
  { to: "/trekker", label: "Dashboard", icon: "bi bi-speedometer2" },
  { to: "/trekker/browse", label: "Browse Treks", icon: "bi bi-map" },
  { to: "/trekker/history", label: "History", icon: "bi bi-clock-history" },
  { to: "/trekker/profile", label: "Profile", icon: "bi bi-person" },
];
const routes = [
  { path: "/", redirect: "/login" },
  { path: "/login", component: Login },
  { path: "/register", component: Register },

  // Admin section
  {
    path: "/admin",
    component: { ...DashboardLayout },
    props: { links: adminLinks },
    children: [
      { path: "", component: AdminDashboard },
      { path: "treks", component: AdminTreks },
      { path: "staff", component: AdminStaff },
      { path: "users", component: AdminUsers },
      { path: "bookings", component: AdminBookings },
    ],
    meta: { role: "admin" },
  },

  // Staff section
  {
    path: "/staff",
    component: { ...DashboardLayout },
    props: { links: staffLinks },
    children: [
      { path: "", component: StaffDashboard },
      { path: "trek/:id", component: StaffManageTrek },
    ],
    meta: { role: "staff" },
  },

  // Trekker section
  {
    path: "/trekker",
    component: { ...DashboardLayout },
    props: { links: userLinks },
    children: [
      { path: "", component: UserDashboard },
      { path: "browse", component: UserBrowse },
      { path: "history", component: UserHistory },
      { path: "profile", component: UserProfile },
    ],
    meta: { role: "trekker" },
  },
];
const router = createRouter({ history: createWebHashHistory(), routes });

// ROUTE GUARD

router.beforeEach((to) => {
  const needsRole = to.matched.find((r) => r.meta && r.meta.role);
  if (needsRole) {
    if (!auth.token) return "/login";
    if (auth.role !== needsRole.meta.role) return "/" + auth.role;
  }

  if ((to.path === "/login" || to.path === "/register") && auth.token) {
    return "/" + auth.role;
  }
});

// ROOT APP + MOUNT

const App = { template: `<router-view></router-view>` };
createApp(App).use(router).mount("#app");
